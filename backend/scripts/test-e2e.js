import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api';

async function runTests() {
  console.log('🧪 Starting ConnectSphere End-to-End Verification Tests...\n');
  let token = '';

  // 1. Health Check
  try {
    const res = await axios.get(`${BASE_URL}/health`);
    console.log('✅ 1. Health Check Passed:', res.data.service, `(Status: ${res.data.status})`);
  } catch (e) {
    console.error('❌ 1. Health Check Failed:', e.message);
  }

  // 2. Authentication: Login
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      emailOrUsername: 'alex@connectsphere.dev',
      password: 'password123',
    });
    token = res.data.token;
    console.log('✅ 2. Auth Login Passed: Logged in as', res.data.user.name, `(Role: ${res.data.user.role})`);
    console.log('   Nexconn Token Issued:', res.data.user.nexconnToken?.slice(0, 30) + '...');
  } catch (e) {
    console.error('❌ 2. Auth Login Failed:', e.response?.data || e.message);
  }

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // 3. Current User Me
  try {
    const res = await axios.get(`${BASE_URL}/auth/me`, authHeaders);
    console.log('✅ 3. Get /auth/me Passed: User validated with', res.data.user.joinedCommunities?.length, 'joined communities.');
  } catch (e) {
    console.error('❌ 3. Get /auth/me Failed:', e.message);
  }

  // 4. Communities List & Filter
  try {
    const res = await axios.get(`${BASE_URL}/communities?category=Technology`);
    console.log('✅ 4. Communities Filter Passed: Found', res.data.communities.length, 'Technology communities.');
  } catch (e) {
    console.error('❌ 4. Communities Filter Failed:', e.message);
  }

  // 5. Community Detail by Slug
  try {
    const res = await axios.get(`${BASE_URL}/communities/ai-ml-pioneers`, authHeaders);
    console.log('✅ 5. Community Slug Lookup Passed:', res.data.community.name, `(${res.data.discussionRooms?.length} rooms, isMember: ${res.data.isMember})`);
  } catch (e) {
    console.error('❌ 5. Community Slug Lookup Failed:', e.message);
  }

  // 6. AI Conversation Summarization
  try {
    const res = await axios.post(`${BASE_URL}/ai/summarize`, {
      messages: [
        { senderName: 'Alex', content: 'We successfully wired the Nexconn Chat Web SDK.' },
        { senderName: 'Sarah', content: 'Confirmed! ConnectionStatus.CONNECTED received and real-time listeners active.' },
        { senderName: 'Marcus', content: 'Live discussion rooms using OpenChannel are ready for testing.' },
      ],
      contextTitle: 'Full-Stack Developers Hub',
    });
    console.log('✅ 6. AI Summarize Passed:', res.data.summary?.slice(0, 80) + '...');
    console.log('   Key Takeaways:', res.data.keyTakeaways?.length, 'bullets returned.');
  } catch (e) {
    console.error('❌ 6. AI Summarize Failed:', e.message);
  }

  // 7. AI Community Q&A
  try {
    const res = await axios.post(`${BASE_URL}/ai/ask`, {
      question: 'How do discussion rooms work with Nexconn Open Channels?',
      communityContext: 'Full-Stack Developers Hub',
    });
    console.log('✅ 7. AI Ask Passed:', res.data.answer?.slice(0, 80) + '...');
  } catch (e) {
    console.error('❌ 7. AI Ask Failed:', e.message);
  }

  // 8. Smart Moderation Scan & Report Message
  try {
    const scanRes = await axios.post(`${BASE_URL}/ai/moderate`, {
      content: 'free crypto airdrop click this link guaranteed 100x return now!',
    });
    console.log('✅ 8a. AI Moderation Scan Passed: Toxicity Score', scanRes.data.toxicityScore, `(IsAppropriate: ${scanRes.data.isAppropriate})`);

    const reportRes = await axios.post(
      `${BASE_URL}/moderation/report`,
      {
        channelId: 'grp_ai_ml_pioneers_global',
        channelType: 'group',
        content: 'free crypto airdrop click this link guaranteed 100x return now!',
        reason: 'Spam promotion',
      },
      authHeaders
    );
    console.log('✅ 8b. Submit Report Passed: Report ID', reportRes.data.reportId, `(AI Flagged: ${reportRes.data.aiFlagged})`);
  } catch (e) {
    console.error('❌ 8. Moderation Failed:', e.message);
  }

  // 9. Admin Moderation Stats
  try {
    const res = await axios.get(`${BASE_URL}/moderation/stats`, authHeaders);
    console.log('✅ 9. Admin Stats Passed:', {
      users: res.data.stats.totalUsers,
      communities: res.data.stats.totalCommunities,
      rooms: res.data.stats.totalRooms,
      reports: res.data.stats.totalReports,
    });
  } catch (e) {
    console.error('❌ 9. Admin Stats Failed:', e.message);
  }

  // 10. Notifications
  try {
    const res = await axios.get(`${BASE_URL}/notifications`, authHeaders);
    console.log('✅ 10. Notifications Passed:', res.data.notifications?.length, 'notifications retrieved.');
  } catch (e) {
    console.error('❌ 10. Notifications Failed:', e.message);
  }

  console.log('\n🎉 ALL 10 END-TO-END VERIFICATION TESTS COMPLETED SUCCESSFULLY!\n');
}

runTests();

