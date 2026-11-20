import {
  NCEngine,
  ConnectionStatusHandler,
  ConnectionStatus,
  MessageHandler,
  DirectChannel,
  GroupChannel,
  OpenChannel,
  BaseChannel,
  DirectChannelIdentifier,
  GroupChannelIdentifier,
  SendTextMessageParams,
  Helper,
} from '@nexconn/chat';

export interface ChatMessage {
  messageId: string;
  senderUserId: string;
  senderName?: string;
  senderAvatar?: string;
  targetId: string;
  channelType: 'direct' | 'group' | 'open';
  content: string;
  sentTime: number;
  isSelf?: boolean;
  status?: 'sending' | 'sent' | 'failed';
  mediaUrl?: string;
}

type MessageCallback = (msg: ChatMessage) => void;
type StatusCallback = (status: ConnectionStatus, statusText: string) => void;

class NexconnChatService {
  private isInitialized = false;
  private isConnected = false;
  private currentUserId: string | null = null;
  private currentToken: string | null = null;
  private currentAppKey: string | null = null;
  private messageListeners = new Set<MessageCallback>();
  private statusListeners = new Set<StatusCallback>();
  private activeRoomId: string | null = null;
  private activeRoomChannel: OpenChannel | null = null;

  // Local fallback cache for smooth offline/sandbox demonstration
  private localMessages: Map<string, ChatMessage[]> = new Map();

  constructor() {
    this.currentAppKey = import.meta.env.VITE_NEXCONN_APP_KEY || '';
  }

  getSDKStatus() {
    return {
      isInitialized: this.isInitialized,
      isConnected: this.isConnected,
      currentUserId: this.currentUserId,
      hasAppKey: Boolean(this.currentAppKey && this.currentAppKey !== 'YOUR_NEXCONN_APP_KEY'),
      appKeyPreview: this.currentAppKey ? `${this.currentAppKey.slice(0, 4)}...` : 'Not set',
    };
  }

  /**
   * Initialize NCEngine once
   */
  initialize(appKey?: string): boolean {
    const key = appKey || this.currentAppKey || import.meta.env.VITE_NEXCONN_APP_KEY;
    if (!key) {
      console.warn('⚠️ Nexconn Chat: No App Key provided for initialization.');
      return false;
    }

    if (this.isInitialized) {
      return true;
    }

    try {
      this.currentAppKey = key;
      NCEngine.initialize({ appKey: key });
      this.isInitialized = true;
      console.log('✅ Nexconn NCEngine initialized successfully with App Key.');

      // Setup Connection Status Handler
      NCEngine.addConnectionStatusHandler(
        'connectsphere-conn-handler',
        new ConnectionStatusHandler({
          onConnectionStatusChanged: ({ status, code }) => {
            let statusText = 'Disconnected';
            switch (status) {
              case ConnectionStatus.CONNECTED:
                statusText = 'Connected';
                this.isConnected = true;
                break;
              case ConnectionStatus.CONNECTING:
                statusText = 'Connecting...';
                break;
              case ConnectionStatus.DISCONNECTED:
                statusText = 'Disconnected';
                this.isConnected = false;
                break;
              case ConnectionStatus.SUSPENDED:
                statusText = 'Suspended';
                this.isConnected = false;
                break;
              default:
                statusText = `Status: ${status}`;
                break;
            }
            console.log(`[Nexconn SDK] Connection status: ${statusText} (code: ${code})`);
            this.statusListeners.forEach((cb) => cb(status, statusText));
          },
        })
      );

      // Setup Message Handler
      NCEngine.addMessageHandler(
        'connectsphere-msg-handler',
        new MessageHandler({
          onMessageReceived: ({ messages }) => {
            console.log('[Nexconn SDK] Messages received:', messages);
            if (Array.isArray(messages)) {
              messages.forEach((rawMsg) => {
                const targetId = rawMsg.channelIdentifier?.channelId || (rawMsg as any).targetId || '';
                const rawType = rawMsg.channelIdentifier?.channelType as any;
                let channelType: 'direct' | 'group' | 'open' = 'group';
                if (rawType === 1 || rawType === 'direct') channelType = 'direct';
                else if (rawType === 4 || rawType === 'open') channelType = 'open';
                else channelType = 'group';

                const contentObj = rawMsg.content as any;
                const senderName = contentObj?.senderUserInfo?.name || contentObj?.user?.name || rawMsg.senderUserId || 'Unknown';
                const senderAvatar = contentObj?.senderUserInfo?.avatarUrl || contentObj?.user?.portraitUri || contentObj?.user?.avatarUrl;

                const parsedMsg: ChatMessage = {
                  messageId: rawMsg.messageId || `msg_${Date.now()}_${Math.random()}`,
                  senderUserId: rawMsg.senderUserId || 'unknown',
                  senderName,
                  senderAvatar,
                  targetId,
                  channelType,
                  content: contentObj?.text || contentObj?.content || String(rawMsg.content || ''),
                  sentTime: rawMsg.sentTime || Date.now(),
                  isSelf: rawMsg.senderUserId === this.currentUserId,
                };
                this.dispatchIncomingMessage(parsedMsg);
              });
            }
          },
        })
      );

      return true;
    } catch (err: any) {
      console.warn('Nexconn initialize error (running in resilient mode):', err?.message || err);
      this.isInitialized = true;
      return false;
    }
  }

  /**
   * Connect to Nexconn Chat Server with user token
   */
  async connect(userId: string, token: string, appKey?: string): Promise<{ success: boolean; error?: string }> {
    this.currentUserId = userId;
    this.currentToken = token;

    if (!token) {
      this.isConnected = false;
      this.statusListeners.forEach((cb) => cb(ConnectionStatus.DISCONNECTED, 'No Token Provided'));
      return { success: false, error: 'No Nexconn authentication token provided' };
    }

    if (appKey && !this.isInitialized) {
      this.initialize(appKey);
    } else if (!this.isInitialized) {
      this.initialize();
    }

    if (!this.isInitialized) {
      this.isConnected = false;
      this.statusListeners.forEach((cb) => cb(ConnectionStatus.DISCONNECTED, 'SDK Not Initialized'));
      return { success: false, error: 'Nexconn NCEngine failed to initialize' };
    }

    // Set connecting state
    this.statusListeners.forEach((cb) => cb(ConnectionStatus.CONNECTING, 'Connecting...'));

    // Attempt live Nexconn SDK connection
    try {
      console.log(`[Nexconn SDK] Attempting connection for user: ${userId}...`);
      const res = await NCEngine.connect({ token });

      if (res && (res.code === 0 || (res as any).isOk)) {
        this.isConnected = true;
        const connectedId = res.data?.userId || userId;
        console.log(`✅ [Nexconn SDK] Connected successfully. User ID: ${connectedId}`);
        this.statusListeners.forEach((cb) => cb(ConnectionStatus.CONNECTED, 'Connected'));
        return { success: true };
      }

      // Explicit failure: DO NOT mark connected or simulate success
      this.isConnected = false;
      const errorMsg = res?.msg || `Connection failed with code: ${res?.code}`;
      console.error(`❌ [Nexconn SDK] Connection failed: ${errorMsg}`);
      this.statusListeners.forEach((cb) => cb(ConnectionStatus.DISCONNECTED, `Disconnected (${res?.code || 'Error'})`));
      return { success: false, error: errorMsg };
    } catch (error: any) {
      // Explicit failure: DO NOT mark connected or simulate success
      this.isConnected = false;
      const errorMsg = error?.message || 'Connection failed';
      console.error('❌ [Nexconn SDK] Connection error:', errorMsg);
      this.statusListeners.forEach((cb) => cb(ConnectionStatus.DISCONNECTED, 'Connection Failed'));
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Disconnect from Chat Server
   */
  async disconnect(): Promise<void> {
    try {
      if (this.activeRoomChannel) {
        await this.activeRoomChannel.exitChannel();
        this.activeRoomChannel = null;
        this.activeRoomId = null;
      }
      await NCEngine.disconnect();
    } catch (err) {
      console.warn('Disconnect error:', err);
    }
    this.isConnected = false;
    this.currentUserId = null;
    this.currentToken = null;
    this.statusListeners.forEach((cb) => cb(ConnectionStatus.DISCONNECTED, 'Disconnected'));
  }

  /**
   * Subscribe to real-time incoming messages
   */
  onMessage(callback: MessageCallback): () => void {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  /**
   * Subscribe to connection status changes
   */
  onStatusChange(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  private dispatchIncomingMessage(msg: ChatMessage) {
    // Save to channel local cache
    const key = `${msg.channelType}:${msg.targetId}`;
    const list = this.localMessages.get(key) || [];
    list.push(msg);
    this.localMessages.set(key, list);

    this.messageListeners.forEach((cb) => cb(msg));
  }

  /**
   * Send 1-to-1 Direct Message
   */
  async sendDirectMessage(targetUserId: string, text: string, senderName = 'You', senderAvatar = ''): Promise<ChatMessage> {
    const newMsg: ChatMessage = {
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      senderUserId: this.currentUserId || 'me',
      senderName,
      senderAvatar,
      targetId: targetUserId,
      channelType: 'direct',
      content: text,
      sentTime: Date.now(),
      isSelf: true,
      status: 'sending',
    };

    if (!this.isConnected) {
      console.error('[Nexconn SDK] Cannot send direct message: SDK not connected');
      newMsg.status = 'failed';
      this.dispatchIncomingMessage(newMsg);
      return newMsg;
    }

    try {
      const channel = new DirectChannel(targetUserId);
      const params = new SendTextMessageParams({
        text,
        senderUserInfo: {
          userId: this.currentUserId || undefined,
          name: senderName,
          avatarUrl: senderAvatar,
        },
      });
      const result = await channel.sendMessage(params);

      if (result && (result.code === 0 || (result as any).isOk)) {
        newMsg.status = 'sent';
      } else {
        console.error('[Nexconn SDK] Direct message send returned error:', result);
        newMsg.status = 'failed';
      }
    } catch (err) {
      console.error('[Nexconn SDK] Direct message send error:', err);
      newMsg.status = 'failed';
    }

    this.dispatchIncomingMessage(newMsg);
    return newMsg;
  }

  /**
   * Send Group Channel Message (Community Discussion)
   */
  async sendGroupMessage(groupId: string, text: string, senderName = 'You', senderAvatar = ''): Promise<ChatMessage> {
    const newMsg: ChatMessage = {
      messageId: `msg_grp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      senderUserId: this.currentUserId || 'me',
      senderName,
      senderAvatar,
      targetId: groupId,
      channelType: 'group',
      content: text,
      sentTime: Date.now(),
      isSelf: true,
      status: 'sending',
    };

    if (!this.isConnected) {
      console.error('[Nexconn SDK] Cannot send group message: SDK not connected');
      newMsg.status = 'failed';
      this.dispatchIncomingMessage(newMsg);
      return newMsg;
    }

    try {
      const channel = new GroupChannel(groupId);
      const params = new SendTextMessageParams({
        text,
        senderUserInfo: {
          userId: this.currentUserId || undefined,
          name: senderName,
          avatarUrl: senderAvatar,
        },
      });
      const result = await channel.sendMessage(params);

      if (result && (result.code === 0 || (result as any).isOk)) {
        newMsg.status = 'sent';
      } else {
        console.error('[Nexconn SDK] Group message send returned error:', result);
        newMsg.status = 'failed';
      }
    } catch (err) {
      console.error('[Nexconn SDK] Group message send error:', err);
      newMsg.status = 'failed';
    }

    this.dispatchIncomingMessage(newMsg);
    return newMsg;
  }

  /**
   * Join and Enter a Live Discussion Room (OpenChannel)
   */
  async joinDiscussionRoom(openChannelId: string): Promise<boolean> {
    if (this.activeRoomId === openChannelId && this.activeRoomChannel) {
      return true;
    }

    // If already in another room, quit it first
    if (this.activeRoomChannel) {
      try {
        await this.activeRoomChannel.exitChannel();
      } catch (e) {
        console.warn('Exit previous open channel error:', e);
      }
    }

    if (!this.isConnected) {
      console.warn('[Nexconn SDK] Cannot join open channel: SDK not connected');
      this.activeRoomId = null;
      this.activeRoomChannel = null;
      return false;
    }

    try {
      const channel = new OpenChannel(openChannelId);
      const result = await channel.enterChannel({
        messageCount: 20,
        extra: 'source=connectsphere_web',
      });

      if (result && (result.code === 0 || (result as any).isOk)) {
        this.activeRoomId = openChannelId;
        this.activeRoomChannel = channel;
        console.log(`✅ [Nexconn SDK] Entered Open Channel: ${openChannelId}`);
        return true;
      }

      console.error('[Nexconn SDK] Enter open channel returned error:', result);
      return false;
    } catch (err) {
      console.error('[Nexconn SDK] Enter open channel exception:', err);
      return false;
    }
  }

  /**
   * Leave current Live Discussion Room
   */
  async leaveDiscussionRoom(): Promise<void> {
    if (this.activeRoomChannel) {
      try {
        await this.activeRoomChannel.exitChannel();
      } catch (err) {
        console.warn('Leave open channel error:', err);
      }
      this.activeRoomChannel = null;
      this.activeRoomId = null;
    }
  }

  /**
   * Send Message to Live Discussion Room (OpenChannel)
   */
  async sendRoomMessage(openChannelId: string, text: string, senderName = 'You', senderAvatar = ''): Promise<ChatMessage> {
    const newMsg: ChatMessage = {
      messageId: `msg_room_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      senderUserId: this.currentUserId || 'me',
      senderName,
      senderAvatar,
      targetId: openChannelId,
      channelType: 'open',
      content: text,
      sentTime: Date.now(),
      isSelf: true,
      status: 'sending',
    };

    if (!this.isConnected) {
      console.error('[Nexconn SDK] Cannot send room message: SDK not connected');
      newMsg.status = 'failed';
      this.dispatchIncomingMessage(newMsg);
      return newMsg;
    }

    try {
      const channel = this.activeRoomChannel || new OpenChannel(openChannelId);
      const params = new SendTextMessageParams({
        text,
        senderUserInfo: {
          userId: this.currentUserId || undefined,
          name: senderName,
          avatarUrl: senderAvatar,
        },
      });
      const result = await channel.sendMessage(params);

      if (result && (result.code === 0 || (result as any).isOk)) {
        newMsg.status = 'sent';
      } else {
        console.error('[Nexconn SDK] Room message send returned error:', result);
        newMsg.status = 'failed';
      }
    } catch (err) {
      console.error('[Nexconn SDK] Room message send error:', err);
      newMsg.status = 'failed';
    }

    this.dispatchIncomingMessage(newMsg);
    return newMsg;
  }

  /**
   * Send File / Media message
   */
  async sendMediaMessage(
    targetId: string,
    channelType: 'direct' | 'group' | 'open',
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ChatMessage | null> {
    const msgId = `msg_media_${Date.now()}`;
    const objectUrl = URL.createObjectURL(file);

    const newMsg: ChatMessage = {
      messageId: msgId,
      senderUserId: this.currentUserId || 'me',
      targetId,
      channelType,
      content: `[File] ${file.name} (${Math.round(file.size / 1024)} KB)`,
      mediaUrl: objectUrl,
      sentTime: Date.now(),
      isSelf: true,
      status: 'sending',
    };

    if (!this.isConnected) {
      console.error('[Nexconn SDK] Cannot send media: SDK not connected');
      newMsg.status = 'failed';
      this.dispatchIncomingMessage(newMsg);
      return newMsg;
    }

    try {
      const { isOk, data: params } = await Helper.createSendFileMessageParams(file);
      if (isOk && params) {
        params.onUploadProgress = (progress) => {
          if (onProgress) onProgress(progress);
        };

        let channel: any;
        if (channelType === 'direct') channel = new DirectChannel(targetId);
        else if (channelType === 'group') channel = new GroupChannel(targetId);
        else channel = new OpenChannel(targetId);

        const result = await channel.sendMediaMessage(params);
        if (result && (result.code === 0 || (result as any).isOk)) {
          newMsg.status = 'sent';
        } else {
          newMsg.status = 'failed';
        }
      } else {
        newMsg.status = 'failed';
      }
    } catch (err) {
      console.error('Send media error:', err);
      newMsg.status = 'failed';
    }

    this.dispatchIncomingMessage(newMsg);
    return newMsg;
  }

  /**
   * Load history messages for a channel
   */
  async loadHistory(channelType: 'direct' | 'group' | 'open', targetId: string): Promise<ChatMessage[]> {
    const key = `${channelType}:${targetId}`;
    const cached = this.localMessages.get(key) || [];

    // Attempt SDK remote query if connected
    if (this.isConnected) {
      try {
        let rawList: any[] = [];
        if (channelType === 'open') {
          const query = OpenChannel.createOpenChannelMessagesQuery({
            channelId: targetId,
            pageSize: 30,
          });
          const pageResult = await query.loadNextPage();
          if (pageResult && (pageResult.isOk || pageResult.code === 0)) {
            const d = pageResult.data as any;
            rawList = Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [];
          }
        } else {
          const channelIdentifier =
            channelType === 'direct'
              ? new DirectChannelIdentifier(targetId)
              : new GroupChannelIdentifier(targetId);

          const query = BaseChannel.createMessagesQuery({
            channelIdentifier,
            pageSize: 30,
          });

          const pageResult = await query.loadNextPage();
          if (pageResult && (pageResult.isOk || pageResult.code === 0)) {
            const d = pageResult.data as any;
            rawList = Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [];
          }
        }

        if (rawList.length > 0) {
          const remoteMsgs: ChatMessage[] = rawList.map((d: any) => ({
            messageId: d.messageId || String(Math.random()),
            senderUserId: d.senderUserId || 'unknown',
            senderName: d.content?.senderUserInfo?.name || d.content?.user?.name || d.senderUserId,
            senderAvatar: d.content?.senderUserInfo?.avatarUrl || d.content?.user?.portraitUri || d.content?.user?.avatarUrl,
            targetId: d.targetId || targetId,
            channelType,
            content: d.content?.text || d.content?.content || (typeof d.content === 'string' ? d.content : ''),
            sentTime: d.sentTime || Date.now(),
            isSelf: d.senderUserId === this.currentUserId,
            status: 'sent',
            mediaUrl: d.content?.imageUri || d.content?.remoteUrl || d.content?.fileUrl,
          }));

          this.localMessages.set(key, remoteMsgs);
          return remoteMsgs;
        }
      } catch (err) {
        console.warn('[Nexconn SDK] History query error:', err);
      }
    }

    // Return genuine cached messages from this session, or empty array if none
    return cached;
  }
}

export const nexconnChat = new NexconnChatService();
