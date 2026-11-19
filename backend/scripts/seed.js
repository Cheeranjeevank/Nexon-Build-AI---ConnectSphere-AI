import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Community } from '../models/Community.js';
import { CommunityMember } from '../models/CommunityMember.js';
import { DiscussionRoom } from '../models/DiscussionRoom.js';
import { Notification } from '../models/Notification.js';
import { Report } from '../models/Report.js';

import { nexconnService } from '../services/nexconnService.js';

dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/connectsphere';

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB for seeding...');
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB.');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Community.deleteMany({}),
      CommunityMember.deleteMany({}),
      DiscussionRoom.deleteMany({}),
      Notification.deleteMany({}),
      Report.deleteMany({}),
    ]);
    console.log('Cleared existing collections.');

    // 1. Create Seed Users
    const usersData = [
      {
        username: 'alex_lead',
        email: 'alex@connectsphere.dev',
        password: 'password123',
        name: 'Alex Rivera',
        role: 'admin',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        bio: 'Senior Software Architect & ConnectSphere Core Contributor. Passionate about real-time distributed systems.',
        interests: ['Technology', 'AI', 'Startups', 'Real-time Systems'],
      },
      {
        username: 'sarah_ai',
        email: 'sarah@connectsphere.dev',
        password: 'password123',
        name: 'Sarah Chen',
        role: 'moderator',
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
        bio: 'AI Research Scientist & Community Lead. Exploring multimodal agents, LLMs, and real-time collaboration.',
        interests: ['AI', 'Technology', 'Education', 'Machine Learning'],
      },
      {
        username: 'marcus_founder',
        email: 'marcus@connectsphere.dev',
        password: 'password123',
        name: 'Marcus Vance',
        role: 'user',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        bio: 'Founder at HyperScale. YC alumnus building AI-driven developer platforms. Always open to collaborate.',
        interests: ['Startups', 'Technology', 'Entertainment'],
      },
      {
        username: 'elena_dev',
        email: 'elena@connectsphere.dev',
        password: 'password123',
        name: 'Elena Rostova',
        role: 'user',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
        bio: 'Frontend wizard & UX designer. Crafting glassmorphic interfaces and responsive real-time apps.',
        interests: ['Technology', 'Design', 'Gaming'],
      },
      {
        username: 'kai_gamer',
        email: 'kai@connectsphere.dev',
        password: 'password123',
        name: 'Kai Tanaka',
        role: 'user',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
        bio: 'Indie game developer & Unreal Engine enthusiast. Creating immersive sci-fi worlds.',
        interests: ['Gaming', 'Technology', 'Entertainment'],
      },
    ];

    const createdUsers = [];
    for (const u of usersData) {
      const user = new User(u);
      try {
        const tokenRes = await nexconnService.issueAccessToken(user._id, user.name, user.avatarUrl);
        user.nexconnToken = tokenRes.accessToken;
        console.log(`Issued live Nexconn token for ${user.name}`);
      } catch (err) {
        user.nexconnToken = `nx_seed_${user._id}_token`;
      }
      await user.save();
      createdUsers.push(user);
    }
    console.log(`Created ${createdUsers.length} seed users.`);

    const [alex, sarah, marcus, elena, kai] = createdUsers;

    // 2. Create Communities
    const communitiesData = [
      {
        name: 'AI & Machine Learning Pioneers',
        slug: 'ai-ml-pioneers',
        description:
          'A hub for AI researchers, engineers, and enthusiasts discussing LLMs, multimodal architectures, and intelligent agents.',
        category: 'Technology',
        avatarUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=200&auto=format&fit=crop&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&auto=format&fit=crop&q=80',
        owner: sarah._id,
        nexconnGroupId: 'grp_ai_ml_pioneers_global',
        membersCount: 4,
        featured: true,
        rules: [
          'Share reproducible findings and papers.',
          'Respectful critique of models and methodologies.',
          'No low-effort hype or unverified claims.',
        ],
        tags: ['AI', 'LLM', 'DeepLearning', 'Agents'],
      },
      {
        name: 'Full-Stack Developers Hub',
        slug: 'fullstack-devs-hub',
        description:
          'Everything web, mobile, and cloud: React, Vite, Node.js, distributed databases, real-time WebSockets, and modern dev tools.',
        category: 'Technology',
        avatarUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=200&auto=format&fit=crop&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80',
        owner: alex._id,
        nexconnGroupId: 'grp_fullstack_devs_hub',
        membersCount: 5,
        featured: true,
        rules: [
          'Include code snippets and error logs when asking for help.',
          'Constructive feedback only.',
          'No unsolicited private messages.',
        ],
        tags: ['React', 'NodeJS', 'Vite', 'TypeScript', 'WebDev'],
      },
      {
        name: 'SaaS Founders & Builders',
        slug: 'saas-founders-builders',
        description:
          'Connect with early-stage founders building bootstrapped and venture-backed SaaS startups. Share revenue milestones and growth playbooks.',
        category: 'Startups',
        avatarUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&auto=format&fit=crop&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80',
        owner: marcus._id,
        nexconnGroupId: 'grp_saas_founders_builders',
        membersCount: 3,
        featured: true,
        rules: [
          'Transparent discussions on metrics and learnings.',
          'No hard spamming or aggressive sales pitches.',
        ],
        tags: ['SaaS', 'Startups', 'Growth', 'ProductMarketFit'],
      },
      {
        name: 'Cyberpunk & Indie Game Devs',
        slug: 'cyberpunk-indie-gamedevs',
        description:
          'Indie developers, 3D artists, and audio designers creating next-gen games with Unreal Engine, Unity, and WebGPU.',
        category: 'Gaming',
        avatarUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80',
        owner: kai._id,
        nexconnGroupId: 'grp_indie_gamedevs_nexus',
        membersCount: 3,
        featured: false,
        rules: [
          'Showcase gameplay clips and work-in-progress shaders.',
          'Credit all assets and collaborators.',
        ],
        tags: ['GameDev', 'IndieGames', 'UnrealEngine', '3DArt'],
      },
      {
        name: 'Next-Gen Developers Academy',
        slug: 'nextgen-devs-academy',
        description:
          'Collaborative learning ecosystem for students, bootcampers, and self-taught developers mastering modern software engineering.',
        category: 'Education',
        avatarUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=200&auto=format&fit=crop&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80',
        owner: elena._id,
        nexconnGroupId: 'grp_nextgen_academy',
        membersCount: 4,
        featured: false,
        rules: [
          'Encourage beginners; every question is welcome.',
          'Provide explanations alongside answers.',
        ],
        tags: ['Education', 'Coding', 'Mentorship', 'Career'],
      },
      {
        name: 'Open Innovation & Hackathons',
        slug: 'open-innovation-hackathons',
        description:
          'Form teams, brainstorm disruptive ideas, and showcase cutting-edge hackathon submissions powered by Nexconn and AI.',
        category: 'General discussions',
        avatarUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=200&auto=format&fit=crop&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
        owner: alex._id,
        nexconnGroupId: 'grp_open_innovation_lab',
        membersCount: 5,
        featured: true,
        rules: [
          'Share innovative hacks and open-source projects.',
          'Help fellow participants solve technical blockers.',
        ],
        tags: ['Hackathon', 'OpenInnovation', 'Nexconn', 'AI'],
      },
    ];

    const createdCommunities = [];
    for (const c of communitiesData) {
      const comm = new Community(c);
      await comm.save();
      createdCommunities.push(comm);

      // Create owner membership
      await CommunityMember.create({
        community: comm._id,
        user: comm.owner,
        role: 'owner',
      });

      // Add to owner's joined communities
      await User.findByIdAndUpdate(comm.owner, {
        $addToSet: { joinedCommunities: comm._id },
      });

      // Register Group Channel on Nexconn server
      const ownerUser = createdUsers.find(u => String(u._id) === String(comm.owner));
      const ownerName = ownerUser ? ownerUser.name : 'Admin';
      const gcResult = await nexconnService.createGroupChannel(
        comm.nexconnGroupId,
        comm.name,
        String(comm.owner),
        [],
        { introduction: comm.description, portraitUrl: comm.avatarUrl }
      );
      console.log(`Nexconn GroupChannel "${comm.nexconnGroupId}" → code: ${gcResult.code ?? (gcResult.isMock ? 'MOCK' : '?')}`);
    }
    console.log(`Created ${createdCommunities.length} communities.`);

    const [aiComm, devComm, saasComm, gameComm, eduComm, hackComm] = createdCommunities;

    // Register ALL users into their respective Nexconn Group Channels
    console.log('Registering users into Nexconn group channels...');
    const communityUserMap = [
      { comm: aiComm, users: [sarah, alex, elena, marcus] },
      { comm: devComm, users: [alex, sarah, elena, kai, marcus] },
      { comm: saasComm, users: [marcus, alex, sarah] },
      { comm: gameComm, users: [kai, alex, elena] },
      { comm: eduComm, users: [elena, alex, sarah, kai] },
      { comm: hackComm, users: [alex, sarah, marcus, elena, kai] },
    ];
    for (const { comm, users } of communityUserMap) {
      const userIds = users.map(u => String(u._id));
      const invResult = await nexconnService.inviteToGroupChannel(comm.nexconnGroupId, userIds);
      console.log(`  → invited ${userIds.length} users to "${comm.nexconnGroupId}": code ${invResult.code ?? (invResult.isMock ? 'MOCK' : '?')}`);
    }

    // Cross-join members to simulate real activity
    const memberships = [
      { community: aiComm._id, user: alex._id, role: 'member' },
      { community: aiComm._id, user: elena._id, role: 'member' },
      { community: aiComm._id, user: marcus._id, role: 'member' },
      { community: devComm._id, user: sarah._id, role: 'moderator' },
      { community: devComm._id, user: elena._id, role: 'member' },
      { community: devComm._id, user: kai._id, role: 'member' },
      { community: devComm._id, user: marcus._id, role: 'member' },
      { community: saasComm._id, user: alex._id, role: 'member' },
      { community: saasComm._id, user: sarah._id, role: 'member' },
      { community: gameComm._id, user: alex._id, role: 'member' },
      { community: gameComm._id, user: elena._id, role: 'member' },
      { community: eduComm._id, user: alex._id, role: 'member' },
      { community: eduComm._id, user: sarah._id, role: 'member' },
      { community: eduComm._id, user: kai._id, role: 'member' },
      { community: hackComm._id, user: sarah._id, role: 'moderator' },
      { community: hackComm._id, user: marcus._id, role: 'member' },
      { community: hackComm._id, user: elena._id, role: 'member' },
      { community: hackComm._id, user: kai._id, role: 'member' },
    ];

    for (const m of memberships) {
      await CommunityMember.create(m);
      await User.findByIdAndUpdate(m.user, {
        $addToSet: { joinedCommunities: m.community },
      });
    }

    // 3. Create Discussion Rooms (Open Channels for real-time room chat)
    const roomsData = [
      {
        community: aiComm._id,
        name: 'LLM Fine-Tuning & Quantization',
        topic: 'Best practices for 4-bit LoRA and running models locally with Ollama & vLLM',
        description: 'Interactive room for deep dive into model quantization and inference speed.',
        openChannelId: 'room_ai_finetune_live',
        createdBy: sarah._id,
        participantCount: 8,
        isActive: true,
        tags: ['LLM', 'LoRA', 'vLLM'],
      },
      {
        community: aiComm._id,
        name: 'Autonomous Multi-Agent Architectures',
        topic: 'Designing cooperative agent swarms with memory, tools, and supervisor coordination',
        description: 'Live whiteboard and discussion on agentic systems.',
        openChannelId: 'room_ai_agents_swarm',
        createdBy: alex._id,
        participantCount: 14,
        isActive: true,
        tags: ['Agents', 'Architecture', 'AI'],
      },
      {
        community: devComm._id,
        name: 'Real-Time Messaging with Nexconn SDK',
        topic: 'Live Q&A on integrating Nexconn Chat SDK Web, connection lifecycles, and event listeners',
        description: 'Ask questions, share code snippets, and review architecture patterns.',
        openChannelId: 'room_dev_nexconn_chat',
        createdBy: alex._id,
        participantCount: 19,
        isActive: true,
        tags: ['Nexconn', 'RealTime', 'WebSockets', 'SDK'],
      },
      {
        community: devComm._id,
        name: 'Vite 6 & React 19 Performance Tuning',
        topic: 'Server components, asset optimization, and lightning-fast HMR workflows',
        description: 'Benchmarking modern build tools and bundle size analysis.',
        openChannelId: 'room_dev_vite_react',
        createdBy: elena._id,
        participantCount: 6,
        isActive: true,
        tags: ['Vite', 'React', 'Performance'],
      },
      {
        community: saasComm._id,
        name: 'Pricing Strategy & Pre-Seed Funding Clinic',
        topic: 'How to price B2B SaaS APIs and structure your investor cap table',
        description: 'Interactive founder clinic with live pitch reviews.',
        openChannelId: 'room_saas_pricing_clinic',
        createdBy: marcus._id,
        participantCount: 11,
        isActive: true,
        tags: ['Pricing', 'VentureCapital', 'SaaS'],
      },
      {
        community: hackComm._id,
        name: 'Hackathon War Room: Final Pitch Polish',
        topic: 'Rehearsing live demos, structuring presentation slides, and showcasing innovation',
        description: 'Collaborative feedback room before final hackathon judging.',
        openChannelId: 'room_hackathon_war_room',
        createdBy: alex._id,
        participantCount: 22,
        isActive: true,
        tags: ['Hackathon', 'Pitch', 'Demo', 'OpenInnovation'],
      },
    ];

    for (const r of roomsData) {
      await DiscussionRoom.create(r);
      // Register Open Channel on Nexconn server (TTL: 7 days)
      const ocResult = await nexconnService.createOpenChannel(r.openChannelId, 10080);
      console.log(`Nexconn OpenChannel "${r.openChannelId}" → code: ${ocResult.code ?? (ocResult.isMock ? 'MOCK' : '?')}`);
    }
    console.log(`Created ${roomsData.length} discussion rooms.`);

    // 4. Create Notifications
    const notificationsData = [
      {
        recipient: alex._id,
        sender: sarah._id,
        type: 'message',
        title: 'New Direct Message',
        content: 'Sarah Chen sent you a message: "The Nexconn Chat integration is running smoothly!"',
        link: '/messages',
      },
      {
        recipient: alex._id,
        sender: marcus._id,
        type: 'new_member',
        title: 'New Community Member',
        content: 'Marcus Vance joined "Full-Stack Developers Hub"!',
        link: '/community/fullstack-devs-hub',
      },
      {
        recipient: alex._id,
        sender: elena._id,
        type: 'discussion_activity',
        title: 'Live Room Buzzing',
        content: 'Elena Rostova started talking in "Real-Time Messaging with Nexconn SDK"',
        link: '/community/fullstack-devs-hub',
      },
    ];

    for (const n of notificationsData) {
      await Notification.create(n);
    }
    console.log(`Created ${notificationsData.length} notifications.`);

    // 5. Create Sample Moderation Report
    await Report.create({
      reporter: alex._id,
      reportedUser: kai._id,
      messageId: 'msg_sample_flag_101',
      channelId: 'grp_ai_ml_pioneers_global',
      channelType: 'group',
      content: 'FREE crypto airdrop click this link guaranteed 500x return now!',
      reason: 'Spam / unsolicited financial scheme',
      aiAnalysis: {
        toxicityScore: 0.88,
        flaggedCategories: ['spam', 'commercial_promotion'],
        recommendation: 'flag_for_review',
        isAppropriate: false,
      },
      status: 'pending',
    });
    console.log('Created sample moderation report.');

    console.log('🎉 Seeding successfully completed!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();

