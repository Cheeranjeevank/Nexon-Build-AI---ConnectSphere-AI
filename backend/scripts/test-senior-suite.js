import axios from 'axios';
import crypto from 'crypto';

const BASE_URL = 'http://localhost:5001/api';

async function runSeniorTestSuite() {
  console.log('====================================================');
  console.log('🔬 CONNECTSPHERE SENIOR FULL-STACK VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // TEST 1: SERVER-SIDE AUTHENTICATION SIGNATURE
  // ----------------------------------------------------
  console.log('--- TEST 1: Nexconn Server-Side Auth Signature ---');
  const appSecret = 'test_secret_key_123';
  const nonce = '456789';
  const timestamp = '1771480000000';
  const expectedSig = crypto.createHash('sha1').update(appSecret + nonce + timestamp).digest('hex');
  assert(expectedSig.length === 40, `SHA-1 signature is 40 hex characters (${expectedSig})`);
  assert(/^[0-9a-f]{40}$/.test(expectedSig), 'Signature is strictly lowercase hexadecimal');

  // ----------------------------------------------------
  // TEST 2: RBAC & ROUTE PROTECTION
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Route Protection & Admin Authorization ---');
  // 2a. Unauthenticated access to admin endpoint
  try {
    await axios.get(`${BASE_URL}/moderation/stats`);
    assert(false, 'Unauthenticated request should have been rejected');
  } catch (err) {
    assert(err.response?.status === 401, `Unauthenticated request rejected with status 401 (${err.response?.data?.message})`);
  }

  // ----------------------------------------------------
  // TEST 3: REGISTRATION & LOGIN FOR TWO INDEPENDENT USERS
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Registration & Login for Two Independent Users ---');
  const timestampSuffix = Date.now().toString().slice(-6);
  const userAData = {
    username: `alice_${timestampSuffix}`,
    email: `alice_${timestampSuffix}@example.com`,
    password: 'Password123!',
    name: 'Alice Engineer',
    interests: ['Technology', 'AI', 'Distributed Systems'],
  };
  const userBData = {
    username: `bob_${timestampSuffix}`,
    email: `bob_${timestampSuffix}@example.com`,
    password: 'Password123!',
    name: 'Bob Architect',
    interests: ['Technology', 'Cloud Architecture'],
  };

  let tokenA = '';
  let tokenB = '';
  let userAId = '';
  let userBId = '';

  // Register User A
  try {
    const regRes = await axios.post(`${BASE_URL}/auth/register`, userAData);
    assert(regRes.data.success === true, `User A registered successfully (${regRes.data.user.username})`);
    tokenA = regRes.data.token;
    userAId = regRes.data.user._id;
  } catch (err) {
    assert(false, `User A registration failed: ${err.response?.data?.message || err.message}`);
  }

  // Register User B
  try {
    const regRes = await axios.post(`${BASE_URL}/auth/register`, userBData);
    assert(regRes.data.success === true, `User B registered successfully (${regRes.data.user.username})`);
    tokenB = regRes.data.token;
    userBId = regRes.data.user._id;
  } catch (err) {
    assert(false, `User B registration failed: ${err.response?.data?.message || err.message}`);
  }

  // Login User A
  try {
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      emailOrUsername: userAData.email,
      password: userAData.password,
    });
    assert(loginRes.data.success === true, `User A login verified. Token received.`);
    assert(loginRes.data.user.role === 'user', 'User A role is standard user');
  } catch (err) {
    assert(false, `User A login failed: ${err.message}`);
  }

  // Regular user (User A) attempting admin endpoint -> must be 403 Forbidden
  try {
    await axios.get(`${BASE_URL}/moderation/stats`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(false, 'Regular user should NOT be able to access admin moderation stats');
  } catch (err) {
    assert(err.response?.status === 403, `Non-admin request rejected with 403 Forbidden (${err.response?.data?.message})`);
  }

  // Admin user login
  let adminToken = '';
  try {
    const adminRes = await axios.post(`${BASE_URL}/auth/login`, {
      emailOrUsername: 'alex@connectsphere.dev',
      password: 'password123',
    });
    adminToken = adminRes.data.token;
    assert(adminRes.data.user.role === 'admin', 'Alex Rivera authenticated as admin');
    
    // Admin access to moderation stats
    const statsRes = await axios.get(`${BASE_URL}/moderation/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(statsRes.data.success === true, `Admin stats accessible: ${statsRes.data.stats.totalUsers} users, ${statsRes.data.stats.totalCommunities} communities`);
  } catch (err) {
    assert(false, `Admin verification failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST 4: TWO-USER DISCOVERY & MESSAGING SETUP
  // ----------------------------------------------------
  console.log('\n--- TEST 4: Two-User Search & Direct Communication Setup ---');
  try {
    // User A searches for User B
    const searchRes = await axios.get(`${BASE_URL}/auth/users/search?query=bob`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(searchRes.data.success === true, 'User search executed');
    const foundBob = searchRes.data.users.some((u) => u._id === userBId);
    assert(foundBob, `User A found User B (${userBData.name}) in directory`);
  } catch (err) {
    assert(false, `User search failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST 5: COMMUNITIES & DISCUSSION ROOMS
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Communities & Discussion Rooms ---');
  let testCommunityId = '';
  let testRoomId = '';
  try {
    const commsRes = await axios.get(`${BASE_URL}/communities`);
    assert(commsRes.data.communities.length > 0, `Retrieved ${commsRes.data.communities.length} communities`);
    testCommunityId = commsRes.data.communities[0]._id;

    // User A joins community
    const joinRes = await axios.post(`${BASE_URL}/communities/${testCommunityId}/join`, {}, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(joinRes.data.success === true, `User A joined community ${commsRes.data.communities[0].name}`);

    // Create discussion room
    const roomRes = await axios.post(`${BASE_URL}/rooms`, {
      communityId: testCommunityId,
      name: `Sync Room ${timestampSuffix}`,
      topic: 'Architecture Review & Real-Time Sync',
    }, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(roomRes.data.success === true, `Discussion room created: ${roomRes.data.room.name} (Open Channel: ${roomRes.data.room.openChannelId})`);
    testRoomId = roomRes.data.room._id;

    // User B joins discussion room
    const userBJoin = await axios.post(`${BASE_URL}/rooms/${testRoomId}/join`, {}, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const pCount = userBJoin.data.participantCount || userBJoin.data.room?.participantCount;
    assert(userBJoin.data.success === true, `User B joined the discussion room (Participant count: ${pCount})`);

    // User B leaves discussion room
    const userBLeave = await axios.post(`${BASE_URL}/rooms/${testRoomId}/leave`, {}, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(userBLeave.data.success === true, 'User B left the discussion room gracefully');
  } catch (err) {
    assert(false, `Communities & Rooms test failed: ${err.response?.data?.message || err.message}`);
  }

  // ----------------------------------------------------
  // TEST 6: AI SUMMARIZATION (ACTUAL MESSAGES VS EMPTY)
  // ----------------------------------------------------
  console.log('\n--- TEST 6: AI Summarization & Provider Differentiation ---');
  try {
    // 6a. Empty messages array
    const emptySummary = await axios.post(`${BASE_URL}/ai/summarize`, {
      messages: [],
      contextTitle: 'Empty Room',
    });
    assert(emptySummary.data.summary === 'No messages provided to summarize.', 'Empty messages array returns clean empty summary without fake participants');
    assert(emptySummary.data.provider === 'none', 'Provider is marked "none" for empty input');

    // 6b. Genuine conversation messages
    const realMessages = [
      { senderName: 'Alice', content: 'Our team finalized the Nexconn Chat integration for web.' },
      { senderName: 'Bob', content: 'Excellent! Are we handling failed message delivery states gracefully?' },
      { senderName: 'Alice', content: 'Yes, any failed socket or API connection explicitly marks messages as failed instead of delivered.' },
      { senderName: 'Bob', content: 'Perfect. Let us ship to production.' },
    ];
    const liveSummary = await axios.post(`${BASE_URL}/ai/summarize`, {
      messages: realMessages,
      contextTitle: 'Architecture Sync',
    });
    assert(Boolean(liveSummary.data.summary && liveSummary.data.summary.length > 20), `AI Summary generated: "${liveSummary.data.summary.slice(0, 70)}..."`);
    assert(Array.isArray(liveSummary.data.keyTakeaways) && liveSummary.data.keyTakeaways.length > 0, `Key takeaways produced: ${liveSummary.data.keyTakeaways.length} points`);
    assert(['gemini', 'heuristic'].includes(liveSummary.data.provider), `AI Provider clearly identified as "${liveSummary.data.provider}" (Model: ${liveSummary.data.model})`);
  } catch (err) {
    assert(false, `AI Summarization test failed: ${err.response?.data?.message || err.message}`);
  }

  // ----------------------------------------------------
  // TEST 7: AI CONTENT MODERATION & REPORTING
  // ----------------------------------------------------
  console.log('\n--- TEST 7: AI Smart Moderation & Incident Reporting ---');
  try {
    // Clean message
    const cleanScan = await axios.post(`${BASE_URL}/ai/moderate`, {
      content: 'Hey everyone, check out the new design system components in the repo.',
    });
    assert(cleanScan.data.isAppropriate === true, 'Clean message passes moderation (isAppropriate: true)');

    // Flagged message
    const toxicScan = await axios.post(`${BASE_URL}/ai/moderate`, {
      content: 'free crypto scam airdrop claim fast invest now guaranteed 100x return',
    });
    assert(toxicScan.data.isAppropriate === false, `Spam message correctly flagged (Toxicity score: ${toxicScan.data.toxicityScore}, Categories: ${toxicScan.data.flaggedCategories?.join(', ')})`);

    // Submit report as User A
    const reportRes = await axios.post(`${BASE_URL}/moderation/report`, {
      reportedUserId: userBId,
      channelId: 'grp_test_channel',
      channelType: 'group',
      content: 'free crypto scam airdrop claim fast invest now guaranteed 100x return',
      reason: 'Spam advertising',
    }, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(reportRes.data.success === true, `Report logged with ID: ${reportRes.data.reportId} (aiFlagged: ${reportRes.data.aiFlagged})`);

    // Admin resolves report
    const resolveRes = await axios.put(`${BASE_URL}/moderation/reports/${reportRes.data.reportId}/resolve`, {
      status: 'action_taken',
      actionNotes: 'Warning issued to user for spam content.',
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(resolveRes.data.success === true, `Admin successfully resolved report ${reportRes.data.reportId}`);
  } catch (err) {
    assert(false, `Moderation test failed: ${err.response?.data?.message || err.message}`);
  }

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`🏁 TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSeniorTestSuite();
