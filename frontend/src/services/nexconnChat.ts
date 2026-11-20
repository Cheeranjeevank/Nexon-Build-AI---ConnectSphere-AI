import {
  NCEngine,
  ConnectionStatusHandler,
  ConnectionStatus,
  MessageHandler,
  ChannelHandler,
  OpenChannelHandler,
  DirectChannel,
  GroupChannel,
  OpenChannel,
  BaseChannel,
  DirectChannelIdentifier,
  GroupChannelIdentifier,
  SendTextMessageParams,
  SendImageMessageParams,
  Helper,
  AreaCode,
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
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  mediaUrl?: string;
  tempId?: string;
}

type MessageCallback = (msg: ChatMessage) => void;
type StatusCallback = (status: ConnectionStatus, statusText: string) => void;
type TypingCallback = (channelId: string, typingUsers: string[]) => void;
type ReadReceiptCallback = (messageIds: string[]) => void;
type ParticipantCallback = (channelId: string, count: number) => void;

class NexconnChatService {
  private isInitialized = false;
  private isInitializing = false;
  private isConnecting = false;
  private isConnected = false;
  private currentUserId: string | null = null;
  private currentToken: string | null = null;
  private currentAppKey: string | null = null;
  private messageListeners = new Set<MessageCallback>();
  private statusListeners = new Set<StatusCallback>();
  private typingListeners = new Set<TypingCallback>();
  private readReceiptListeners = new Set<ReadReceiptCallback>();
  private participantListeners = new Set<ParticipantCallback>();
  private activeRoomId: string | null = null;
  private activeRoomChannel: OpenChannel | null = null;
  private connHandlerId = 'connectsphere-conn-handler';
  private msgHandlerId = 'connectsphere-msg-handler';
  private channelHandlerId = 'connectsphere-channel-handler';
  private openHandlerId = 'connectsphere-open-handler';
  private reconnectTimer: any = null;
  private reconnectAttempts = 0;

  // Session message store for instant UI rendering and status reconciliation
  private localMessages: Map<string, ChatMessage[]> = new Map();

  constructor() {
    this.currentAppKey = import.meta.env.VITE_NEXCONN_APP_KEY || '';
  }

  getSDKStatus() {
    return {
      isInitialized: this.isInitialized,
      isInitializing: this.isInitializing,
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      currentUserId: this.currentUserId,
      hasAppKey: Boolean(this.currentAppKey && this.currentAppKey !== 'YOUR_NEXCONN_APP_KEY'),
      appKeyPreview: this.currentAppKey ? `${this.currentAppKey.slice(0, 4)}...` : 'Not set',
    };
  }

  /**
   * Initialize NCEngine.
   * Safe for retries, prevents concurrent initialization, and sets isInitialized ONLY on success.
   */
  initialize(appKey?: string): boolean {
    const key = (appKey || this.currentAppKey || import.meta.env.VITE_NEXCONN_APP_KEY || '').trim();
    if (!key || key === 'YOUR_NEXCONN_APP_KEY') {
      console.warn('⚠️ Nexconn Chat: No valid App Key provided for initialization.');
      this.isInitialized = false;
      return false;
    }

    if (this.isInitialized && this.currentAppKey === key) {
      return true;
    }

    if (this.isInitializing) {
      console.warn('⚠️ Nexconn Chat: Initialization already in progress.');
      return false;
    }

    this.isInitializing = true;

    try {
      this.currentAppKey = key;
      // Clean up previous handlers if re-initializing with a new key
      try {
        NCEngine.removeConnectionStatusHandler(this.connHandlerId);
      } catch (_) {}
      try {
        NCEngine.removeMessageHandler(this.msgHandlerId);
      } catch (_) {}
      try {
        NCEngine.removeChannelHandler(this.channelHandlerId);
      } catch (_) {}
      try {
        NCEngine.removeOpenChannelHandler(this.openHandlerId);
      } catch (_) {}

      // Initialize NCEngine targeting Singapore data center
      NCEngine.initialize({
        appKey: key,
        areaCode: AreaCode.SG,
      });

      // Setup Connection Status Handler
      NCEngine.addConnectionStatusHandler(
        this.connHandlerId,
        new ConnectionStatusHandler({
          onConnectionStatusChanged: ({ status, code }) => {
            let statusText = 'Disconnected';
            switch (status) {
              case ConnectionStatus.CONNECTED:
                statusText = 'Connected';
                this.isConnected = true;
                this.reconnectAttempts = 0;
                if (this.reconnectTimer) {
                  clearTimeout(this.reconnectTimer);
                  this.reconnectTimer = null;
                }
                break;
              case ConnectionStatus.CONNECTING:
                statusText = 'Connecting...';
                break;
              case ConnectionStatus.DISCONNECTED:
                statusText = 'Disconnected';
                this.isConnected = false;
                this.scheduleReconnect();
                break;
              case ConnectionStatus.SUSPENDED:
                statusText = 'Suspended';
                this.isConnected = false;
                this.scheduleReconnect();
                break;
              default:
                statusText = `Status: ${status}`;
                break;
            }
            console.log(`[Nexconn SDK] Connection status changed: ${statusText} (code: ${code})`);
            this.statusListeners.forEach((cb) => cb(status, statusText));
          },
        })
      );

      // Setup Message Handler
      NCEngine.addMessageHandler(
        this.msgHandlerId,
        new MessageHandler({
          onMessageReceived: ({ messages }) => {
            console.log('[Nexconn SDK] Real-time messages received from server:', messages);
            if (Array.isArray(messages)) {
              messages.forEach((rawMsg) => {
                const targetId = rawMsg.channelIdentifier?.channelId || (rawMsg as any).targetId || '';
                const rawType = rawMsg.channelIdentifier?.channelType as any;
                let channelType: 'direct' | 'group' | 'open' = 'group';
                if (rawType === 1 || rawType === 'direct') channelType = 'direct';
                else if (rawType === 4 || rawType === 'open') channelType = 'open';
                else channelType = 'group';

                const contentObj = rawMsg.content as any;
                const senderName =
                  contentObj?.senderUserInfo?.name || contentObj?.user?.name || rawMsg.senderUserId || 'Unknown';
                const senderAvatar =
                  contentObj?.senderUserInfo?.avatarUrl ||
                  contentObj?.user?.portraitUri ||
                  contentObj?.user?.avatarUrl;

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
                  status: 'delivered',
                  mediaUrl: contentObj?.imageUri || contentObj?.remoteUrl || contentObj?.fileUrl,
                };
                this.dispatchIncomingMessage(parsedMsg);
              });
            }
          },
          onMessageReceiptResponse: ({ responses }: any) => {
            if (Array.isArray(responses)) {
              const readIds = responses.map((r: any) => r.messageId || r.messageUId).filter(Boolean);
              if (readIds.length > 0) {
                this.localMessages.forEach((msgs) => {
                  msgs.forEach((m) => {
                    if (readIds.includes(m.messageId)) {
                      m.status = 'read';
                    }
                  });
                });
                this.readReceiptListeners.forEach((cb) => cb(readIds));
              }
            }
          },
        })
      );

      // Setup Channel Handler (Typing indicator events)
      NCEngine.addChannelHandler(
        this.channelHandlerId,
        new ChannelHandler({
          onTypingStatusChanged: (event) => {
            const channelId = event.channelIdentifier?.channelId;
            const typingUserIds = (event.userTypingStatus || [])
              .map((u) => u.userId)
              .filter((id) => id && id !== this.currentUserId);
            if (channelId) {
              this.typingListeners.forEach((cb) => cb(channelId, typingUserIds));
            }
          },
        })
      );

      // Setup Open Channel Handler (Live participant sync)
      NCEngine.addOpenChannelHandler(
        this.openHandlerId,
        new OpenChannelHandler({
          onParticipantChanged: ({ channelId, participantCount }) => {
            this.participantListeners.forEach((cb) => cb(channelId, participantCount));
          },
          onEntered: ({ channelId, response }) => {
            if (response?.participantCount) {
              this.participantListeners.forEach((cb) => cb(channelId, response.participantCount));
            }
          },
        })
      );

      this.isInitialized = true;
      this.isInitializing = false;
      console.log('✅ Nexconn NCEngine initialized successfully with App Key.');
      return true;
    } catch (err: any) {
      console.error('❌ Nexconn initialize failed:', err?.message || err);
      // BUG FIX: Must remain false on failure so retry is possible
      this.isInitialized = false;
      this.isInitializing = false;
      return false;
    }
  }

  /**
   * Connect to Nexconn Chat Server with verified user token.
   * Includes connection timeout, duplicate prevention, and zero fake success simulation.
   */
  async connect(userId: string, token: string, appKey?: string): Promise<{ success: boolean; error?: string }> {
    if (!userId || !token) {
      this.isConnected = false;
      this.statusListeners.forEach((cb) => cb(ConnectionStatus.DISCONNECTED, 'No Token Provided'));
      return { success: false, error: 'Missing user ID or Nexconn authentication token' };
    }

    // Prevent duplicate connection if already connected as this user
    if (this.isConnected && this.currentUserId === userId && this.currentToken === token) {
      console.log(`[Nexconn SDK] User ${userId} is already connected.`);
      return { success: true };
    }

    // Prevent simultaneous connection attempts
    if (this.isConnecting) {
      console.warn(`[Nexconn SDK] Connection already in progress for user ${this.currentUserId || userId}.`);
      return { success: false, error: 'Connection attempt already in progress' };
    }

    this.currentUserId = userId;
    this.currentToken = token;

    if (!this.isInitialized) {
      const initOk = this.initialize(appKey);
      if (!initOk) {
        this.isConnected = false;
        this.statusListeners.forEach((cb) => cb(ConnectionStatus.DISCONNECTED, 'SDK Init Failed'));
        return { success: false, error: 'Nexconn SDK failed to initialize. Check App Key.' };
      }
    }

    this.isConnecting = true;
    this.statusListeners.forEach((cb) => cb(ConnectionStatus.CONNECTING, 'Connecting...'));

    try {
      console.log(`[Nexconn SDK] Attempting server connection for user: ${userId}...`);

      // 10-second connection timeout guard
      const connectPromise = NCEngine.connect({ token });
      const timeoutPromise = new Promise<{ code: number; msg: string }>((_, reject) =>
        setTimeout(() => reject(new Error('Connection attempt timed out after 10000ms')), 10000)
      );

      const res = (await Promise.race([connectPromise, timeoutPromise])) as any;
      this.isConnecting = false;

      if (res && (res.code === 0 || res.isOk)) {
        this.isConnected = true;
        const connectedId = res.data?.userId || userId;
        console.log(`✅ [Nexconn SDK] Authenticated & Connected successfully. User ID: ${connectedId}`);
        this.statusListeners.forEach((cb) => cb(ConnectionStatus.CONNECTED, 'Connected'));
        return { success: true };
      }

      this.isConnected = false;
      const errorMsg = res?.msg || `Connection failed with status code ${res?.code}`;
      console.error(`❌ [Nexconn SDK] Server rejected connection: ${errorMsg}`);
      this.statusListeners.forEach((cb) => cb(ConnectionStatus.DISCONNECTED, `Disconnected (${res?.code || 'Error'})`));
      return { success: false, error: errorMsg };
    } catch (error: any) {
      this.isConnecting = false;
      this.isConnected = false;
      const errorMsg = error?.message || 'Connection failed';
      console.error('❌ [Nexconn SDK] Connection exception:', errorMsg);
      this.statusListeners.forEach((cb) => cb(ConnectionStatus.DISCONNECTED, 'Connection Failed'));
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Schedule exponential backoff reconnect attempt
   */
  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    if (!this.currentToken || !this.currentUserId) return;
    if (this.reconnectAttempts >= 5) {
      console.warn('[Nexconn SDK] Max reconnect attempts reached.');
      return;
    }

    const delay = Math.min(1500 * Math.pow(2, this.reconnectAttempts), 20000);
    this.reconnectAttempts++;
    console.log(`[Nexconn SDK] Scheduling auto-reconnect attempt ${this.reconnectAttempts} in ${delay}ms...`);

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      if (!this.isConnected && this.currentToken && this.currentUserId) {
        await this.connect(this.currentUserId, this.currentToken);
      }
    }, delay);
  }

  /**
   * Disconnect from Chat Server and clean up active listeners and room state.
   */
  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;

    try {
      if (this.activeRoomChannel) {
        await this.activeRoomChannel.exitChannel().catch(() => {});
        this.activeRoomChannel = null;
        this.activeRoomId = null;
      }
      if (this.isInitialized) {
        try {
          NCEngine.removeConnectionStatusHandler(this.connHandlerId);
          NCEngine.removeMessageHandler(this.msgHandlerId);
          NCEngine.removeChannelHandler(this.channelHandlerId);
          NCEngine.removeOpenChannelHandler(this.openHandlerId);
        } catch (_) {}
      }
      await NCEngine.disconnect();
    } catch (err) {
      console.warn('[Nexconn SDK] Disconnect cleanup warning:', err);
    }
    this.isConnected = false;
    this.isConnecting = false;
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

  /**
   * Subscribe to typing status changes
   */
  onTyping(callback: TypingCallback): () => void {
    this.typingListeners.add(callback);
    return () => this.typingListeners.delete(callback);
  }

  /**
   * Subscribe to read receipt responses
   */
  onReadReceipt(callback: ReadReceiptCallback): () => void {
    this.readReceiptListeners.add(callback);
    return () => this.readReceiptListeners.delete(callback);
  }

  /**
   * Subscribe to OpenChannel participant count changes
   */
  onParticipant(callback: ParticipantCallback): () => void {
    this.participantListeners.add(callback);
    return () => this.participantListeners.delete(callback);
  }

  /**
   * Broadcast typing status to active channel
   */
  async sendTypingStatus(channelType: 'direct' | 'group', targetId: string): Promise<void> {
    if (!this.isConnected) return;
    try {
      let channel: any;
      if (channelType === 'direct') channel = new DirectChannel(targetId);
      else if (channelType === 'group') channel = new GroupChannel(targetId);
      if (channel && typeof channel.sendTypingStatus === 'function') {
        await channel.sendTypingStatus('RC:TxtMsg');
      }
    } catch (err) {
      // Non-critical, ignore typing errors
    }
  }

  /**
   * Mark messages as read and send read receipt response to sender
   */
  async markAsRead(channelType: 'direct' | 'group', targetId: string, messageIds: string[]): Promise<void> {
    if (!this.isConnected || !messageIds || messageIds.length === 0) return;
    try {
      let channel: any;
      if (channelType === 'direct') channel = new DirectChannel(targetId);
      else if (channelType === 'group') channel = new GroupChannel(targetId);
      if (channel && typeof channel.sendReadReceiptResponse === 'function') {
        await channel.sendReadReceiptResponse(messageIds);
      }
    } catch (err) {
      // Non-critical
    }
  }

  private dispatchIncomingMessage(msg: ChatMessage) {
    const key = `${msg.channelType}:${msg.targetId}`;
    const list = this.localMessages.get(key) || [];

    // Avoid duplicates by messageId or tempId
    const existingIndex = list.findIndex(
      (m) => m.messageId === msg.messageId || (msg.tempId && m.messageId === msg.tempId)
    );

    if (existingIndex >= 0) {
      list[existingIndex] = msg;
    } else {
      list.push(msg);
    }

    this.localMessages.set(key, list);
    this.messageListeners.forEach((cb) => cb(msg));
  }

  /**
   * Send 1-to-1 Direct Message with server ID reconciliation.
   */
  async sendDirectMessage(
    targetUserId: string,
    text: string,
    senderName = 'You',
    senderAvatar = ''
  ): Promise<ChatMessage> {
    const tempId = `temp_dm_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const newMsg: ChatMessage = {
      messageId: tempId,
      tempId,
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
        // Reconcile server message ID and status
        newMsg.messageId = result.data?.messageId || tempId;
        newMsg.sentTime = result.data?.sentTime || Date.now();
        newMsg.status = 'sent';
      } else {
        console.error('[Nexconn SDK] Direct message send failed:', result);
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
   * Send Group Channel Message (Community Discussion) with server ID reconciliation.
   */
  async sendGroupMessage(
    groupId: string,
    text: string,
    senderName = 'You',
    senderAvatar = ''
  ): Promise<ChatMessage> {
    const tempId = `temp_grp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const newMsg: ChatMessage = {
      messageId: tempId,
      tempId,
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
        // Reconcile server message ID and status
        newMsg.messageId = result.data?.messageId || tempId;
        newMsg.sentTime = result.data?.sentTime || Date.now();
        newMsg.status = 'sent';
      } else {
        console.error('[Nexconn SDK] Group message send failed:', result);
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

    // Exit previous room if switching
    if (this.activeRoomChannel) {
      try {
        await this.activeRoomChannel.exitChannel().catch(() => {});
      } catch (e) {
        console.warn('Exit previous open channel warning:', e);
      }
    }

    if (!this.isConnected) {
      console.warn('[Nexconn SDK] Cannot enter open channel: SDK not connected');
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
      this.activeRoomId = null;
      this.activeRoomChannel = null;
      return false;
    } catch (err) {
      console.error('[Nexconn SDK] Enter open channel exception:', err);
      this.activeRoomId = null;
      this.activeRoomChannel = null;
      return false;
    }
  }

  /**
   * Leave current Live Discussion Room
   */
  async leaveDiscussionRoom(): Promise<void> {
    if (this.activeRoomChannel) {
      try {
        await this.activeRoomChannel.exitChannel().catch(() => {});
      } catch (err) {
        console.warn('Leave open channel warning:', err);
      }
      this.activeRoomChannel = null;
      this.activeRoomId = null;
    }
  }

  /**
   * Send Message to Live Discussion Room (OpenChannel).
   * Enforces that the room MUST be successfully entered first.
   */
  async sendRoomMessage(
    openChannelId: string,
    text: string,
    senderName = 'You',
    senderAvatar = ''
  ): Promise<ChatMessage> {
    const tempId = `temp_room_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const newMsg: ChatMessage = {
      messageId: tempId,
      tempId,
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

    // REQUIREMENT: Users cannot send messages to rooms they have not entered
    if (this.activeRoomId !== openChannelId || !this.activeRoomChannel) {
      console.error(
        `[Nexconn SDK] Cannot send room message: user has not entered Open Channel ${openChannelId}.`
      );
      newMsg.status = 'failed';
      this.dispatchIncomingMessage(newMsg);
      return newMsg;
    }

    try {
      const channel = this.activeRoomChannel;
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
        newMsg.messageId = result.data?.messageId || tempId;
        newMsg.sentTime = result.data?.sentTime || Date.now();
        newMsg.status = 'sent';
      } else {
        console.error('[Nexconn SDK] Room message send failed:', result);
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
   * Retry sending a previously failed message
   */
  async retryMessage(msg: ChatMessage): Promise<ChatMessage> {
    if (msg.channelType === 'direct') {
      return this.sendDirectMessage(msg.targetId, msg.content, msg.senderName, msg.senderAvatar);
    } else if (msg.channelType === 'group') {
      return this.sendGroupMessage(msg.targetId, msg.content, msg.senderName, msg.senderAvatar);
    } else {
      return this.sendRoomMessage(msg.targetId, msg.content, msg.senderName, msg.senderAvatar);
    }
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
    const tempId = `temp_media_${Date.now()}`;
    const objectUrl = URL.createObjectURL(file);

    const newMsg: ChatMessage = {
      messageId: tempId,
      tempId,
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
        else {
          if (this.activeRoomId !== targetId || !this.activeRoomChannel) {
            newMsg.status = 'failed';
            this.dispatchIncomingMessage(newMsg);
            return newMsg;
          }
          channel = this.activeRoomChannel;
        }

        const result = await channel.sendMediaMessage(params);
        if (result && (result.code === 0 || (result as any).isOk)) {
          newMsg.messageId = result.data?.messageId || tempId;
          newMsg.sentTime = result.data?.sentTime || Date.now();
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
   * Load history messages for a channel directly from Nexconn SDK.
   * Never fabricates fake demo messages.
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
            senderName:
              d.content?.senderUserInfo?.name || d.content?.user?.name || d.senderUserId,
            senderAvatar:
              d.content?.senderUserInfo?.avatarUrl ||
              d.content?.user?.portraitUri ||
              d.content?.user?.avatarUrl,
            targetId: d.targetId || targetId,
            channelType,
            content:
              d.content?.text ||
              d.content?.content ||
              (typeof d.content === 'string' ? d.content : ''),
            sentTime: d.sentTime || Date.now(),
            isSelf: d.senderUserId === this.currentUserId,
            status: 'sent',
            mediaUrl: d.content?.imageUri || d.content?.remoteUrl || d.content?.fileUrl,
          }));

          // Merge without losing locally sent messages
          const mergedMap = new Map<string, ChatMessage>();
          remoteMsgs.forEach((m) => mergedMap.set(m.messageId, m));
          cached.forEach((m) => {
            if (!mergedMap.has(m.messageId)) {
              mergedMap.set(m.messageId, m);
            }
          });

          const merged = Array.from(mergedMap.values()).sort((a, b) => a.sentTime - b.sentTime);
          this.localMessages.set(key, merged);
          return merged;
        }
      } catch (err) {
        console.warn('[Nexconn SDK] History query error:', err);
      }
    }

    return cached;
  }
}

export const nexconnChat = new NexconnChatService();

if (typeof window !== 'undefined') {
  (window as any).nexconnChat = nexconnChat;
}
