import assert from "node:assert";
import { execSync } from "node:child_process";

const BASE_URL = "http://localhost:3000";

function seedDb() {
  execSync("node prisma/seed.js", { stdio: "inherit" });
}

async function apiFetch(path, options = {}) {
  const headers = { ...options.headers, Connection: "close" };
  return fetch(`${BASE_URL}${path}`, { ...options, headers });
}

async function runTests() {
  console.log("--- Starting InstaLite Relations End-to-End Test Suite ---");

  // Re-seed
  seedDb();

  // Helper lookups
  async function getRiyaId() {
    const res = await apiFetch(`/users?search=riya`);
    const json = await res.json();
    return json.data[0].id;
  }

  async function getArjunId() {
    const res = await apiFetch(`/users?search=arjun`);
    const json = await res.json();
    return json.data[0].id;
  }

  async function getDevId() {
    const res = await apiFetch(`/users?search=dev_shoots`);
    const json = await res.json();
    return json.data[0].id;
  }

  async function getAdityaId() {
    const res = await apiFetch(`/users?search=aditya`);
    const json = await res.json();
    return json.data[0].id;
  }

  async function getNehaId() {
    const res = await apiFetch(`/users?search=neha`);
    const json = await res.json();
    return json.data[0].id;
  }

  async function getInsta01Id() {
    const res = await apiFetch(`/posts?search=baga`);
    const json = await res.json();
    return json.data[0].id;
  }

  async function getInsta05Id() {
    const res = await apiFetch(`/posts?location=pune&order=asc&limit=1`);
    const json = await res.json();
    return json.data[0].id;
  }

  async function getInsta10Id() {
    const res = await apiFetch(`/posts?search=thali`);
    const json = await res.json();
    return json.data[0].id;
  }

  async function getInsta24Id() {
    const res = await apiFetch(`/posts?search=tiger`);
    const json = await res.json();
    return json.data[0].id;
  }

  // --- Step 01: Health check ---
  console.log("\n[Test 1] GET /health...");
  const resHealth = await apiFetch(`/health`);
  assert.strictEqual(resHealth.status, 200);
  const healthData = await resHealth.json();
  assert.deepStrictEqual(healthData, { status: "OK" });
  console.log("✅ GET /health passed!");

  // --- Step 04: POST /posts with authorId and PATCH /posts/:id ---
  console.log("\n[Test 2] Step 04: POST /posts & PATCH /posts/:id...");
  const riyaId = await getRiyaId();
  const arjunId = await getArjunId();
  const insta01Id = await getInsta01Id();

  // # 1: valid post creation
  const resNewPost = await apiFetch(`/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageUrl: "https://picsum.photos/seed/new01/600/600",
      caption: "First post!",
      authorId: riyaId,
    }),
  });
  assert.strictEqual(resNewPost.status, 201);
  const newPostData = await resNewPost.json();
  assert.strictEqual(newPostData.authorId, riyaId);

  // # 2: missing authorId
  const resMissingAuthor = await apiFetch(`/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageUrl: "https://picsum.photos/seed/new02/600/600",
    }),
  });
  assert.strictEqual(resMissingAuthor.status, 400);
  assert.deepStrictEqual(await resMissingAuthor.json(), {
    error: "imageUrl and authorId are required",
  });

  // # 3: non-existent authorId
  const resNonExistentAuthor = await apiFetch(`/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageUrl: "https://picsum.photos/seed/new03/600/600",
      authorId: 999999,
    }),
  });
  assert.strictEqual(resNonExistentAuthor.status, 404);
  assert.deepStrictEqual(await resNonExistentAuthor.json(), {
    error: "User not found",
  });

  // # 4: patch post (authorId ignored)
  const resPatchPost = await apiFetch(`/posts/${insta01Id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      caption: "Baga, again 🌅",
      authorId: arjunId,
    }),
  });
  assert.strictEqual(resPatchPost.status, 200);
  const patchedPostData = await resPatchPost.json();
  assert.strictEqual(patchedPostData.caption, "Baga, again 🌅");
  assert.strictEqual(patchedPostData.authorId, riyaId);
  console.log("✅ Step 04 passed!");

  // --- Step 05: GET /posts/:id with author and like count ---
  console.log("\n[Test 3] Step 05: GET /posts/:id with author & like count...");
  seedDb();
  const p1Id = await getInsta01Id();
  const p24Id = await getInsta24Id();
  const p05Id = await getInsta05Id();

  const resP1 = await apiFetch(`/posts/${p1Id}`);
  assert.strictEqual(resP1.status, 200);
  const dataP1 = await resP1.json();
  assert.strictEqual(dataP1.author.username, "riya_travels");
  assert.strictEqual(dataP1.author.email, undefined, "Email must not be exposed");
  assert.strictEqual(dataP1._count.likes, 5);

  const resP24 = await apiFetch(`/posts/${p24Id}`);
  assert.strictEqual(resP24.status, 200);
  const dataP24 = await resP24.json();
  assert.strictEqual(dataP24.author.username, "dev_shoots");
  assert.strictEqual(dataP24._count.likes, 6);

  const resP05 = await apiFetch(`/posts/${p05Id}`);
  assert.strictEqual(resP05.status, 200);
  const dataP05 = await resP05.json();
  assert.strictEqual(dataP05.author.username, "arjun_clicks");
  assert.strictEqual(dataP05._count.likes, 0);

  const resP404 = await apiFetch(`/posts/999999`);
  assert.strictEqual(resP404.status, 404);
  assert.deepStrictEqual(await resP404.json(), { error: "Post not found" });
  console.log("✅ Step 05 passed!");

  // --- Step 06: GET /posts with authors, like counts and sortBy=likes ---
  console.log("\n[Test 4] Step 06: GET /posts with author, likes and sortBy...");
  // # 1
  const resLimit2 = await apiFetch(`/posts?limit=2`);
  const dataLimit2 = await resLimit2.json();
  assert.strictEqual(dataLimit2.data[0].imageUrl.split("/")[4], "insta24");
  assert.strictEqual(dataLimit2.data[1].imageUrl.split("/")[4], "insta23");

  // # 2
  const resSortLikes5 = await apiFetch(`/posts?sortBy=likes&limit=5`);
  const dataSortLikes5 = await resSortLikes5.json();
  const keysSortLikes5 = dataSortLikes5.data.map((p) => p.imageUrl.split("/")[4]);
  assert.deepStrictEqual(keysSortLikes5, ["insta24", "insta01", "insta15", "insta10", "insta08"]);

  // # 3
  const resSortLikesAsc3 = await apiFetch(`/posts?sortBy=likes&order=asc&limit=3`);
  const dataSortLikesAsc3 = await resSortLikesAsc3.json();
  const keysSortLikesAsc3 = dataSortLikesAsc3.data.map((p) => p.imageUrl.split("/")[4]);
  assert.deepStrictEqual(keysSortLikesAsc3, ["insta23", "insta21", "insta19"]);

  // # 4
  const resGoa = await apiFetch(`/posts?location=goa&sortBy=likes`);
  const dataGoa = await resGoa.json();
  const keysGoa = dataGoa.data.map((p) => p.imageUrl.split("/")[4]);
  assert.deepStrictEqual(keysGoa, ["insta01", "insta10", "insta23", "insta16"]);
  assert.strictEqual(dataGoa.meta.total, 4);

  // # 5
  const resInvalidSort = await apiFetch(`/posts?sortBy=comments`);
  assert.strictEqual(resInvalidSort.status, 400);
  assert.deepStrictEqual(await resInvalidSort.json(), {
    error: "sortBy must be one of: createdAt, updatedAt, likes",
  });
  console.log("✅ Step 06 passed!");

  // --- Step 07: GET /users/:id with counts & hasPosts filter ---
  console.log("\n[Test 5] Step 07: GET /users/:id counts & hasPosts filter...");
  const uRiyaId = await getRiyaId();
  const uDevId = await getDevId();
  const uAdityaId = await getAdityaId();

  const resURiya = await apiFetch(`/users/${uRiyaId}`);
  const dataURiya = await resURiya.json();
  assert.strictEqual(dataURiya.username, "riya_travels");
  assert.deepStrictEqual(dataURiya._count, { posts: 7, likes: 4 });

  const resUDev = await apiFetch(`/users/${uDevId}`);
  const dataUDev = await resUDev.json();
  assert.strictEqual(dataUDev.username, "dev_shoots");
  assert.deepStrictEqual(dataUDev._count, { posts: 2, likes: 1 });

  const resUAditya = await apiFetch(`/users/${uAdityaId}`);
  const dataUAditya = await resUAditya.json();
  assert.strictEqual(dataUAditya.username, "aditya_codes");
  assert.deepStrictEqual(dataUAditya._count, { posts: 0, likes: 2 });

  const resHasPostsFalse = await apiFetch(`/users?hasPosts=false`);
  const dataHasPostsFalse = await resHasPostsFalse.json();
  assert.strictEqual(dataHasPostsFalse.meta.total, 2);

  const resHasPostsTrue = await apiFetch(`/users?hasPosts=true`);
  const dataHasPostsTrue = await resHasPostsTrue.json();
  assert.strictEqual(dataHasPostsTrue.meta.total, 10);

  const resHasPostsPrivate = await apiFetch(`/users?hasPosts=true&isPrivate=true`);
  const dataHasPostsPrivate = await resHasPostsPrivate.json();
  assert.strictEqual(dataHasPostsPrivate.meta.total, 3);

  const resHasPostsInvalid = await apiFetch(`/users?hasPosts=yes`);
  assert.strictEqual(resHasPostsInvalid.status, 400);
  assert.deepStrictEqual(await resHasPostsInvalid.json(), {
    error: "hasPosts must be true or false",
  });
  console.log("✅ Step 07 passed!");

  // --- Step 08: GET /users/:id/posts ---
  console.log("\n[Test 6] Step 08: GET /users/:id/posts...");
  const resRiyaPosts = await apiFetch(`/users/${uRiyaId}/posts?limit=3`);
  const dataRiyaPosts = await resRiyaPosts.json();
  const keysRiyaPosts = dataRiyaPosts.data.map((p) => p.imageUrl.split("/")[4]);
  assert.deepStrictEqual(keysRiyaPosts, ["insta23", "insta19", "insta16"]);
  assert.deepStrictEqual(dataRiyaPosts.meta, { page: 1, limit: 3, total: 7, totalPages: 3 });

  const resRiyaPostsP3 = await apiFetch(`/users/${uRiyaId}/posts?limit=3&page=3`);
  const dataRiyaPostsP3 = await resRiyaPostsP3.json();
  assert.deepStrictEqual(dataRiyaPostsP3.meta, { page: 3, limit: 3, total: 7, totalPages: 3 });

  const resAdityaPosts = await apiFetch(`/users/${uAdityaId}/posts`);
  const dataAdityaPosts = await resAdityaPosts.json();
  assert.deepStrictEqual(dataAdityaPosts.data, []);
  assert.deepStrictEqual(dataAdityaPosts.meta, { page: 1, limit: 10, total: 0, totalPages: 0 });

  const resUserPosts404 = await apiFetch(`/users/999999/posts`);
  assert.strictEqual(resUserPosts404.status, 404);

  const resUserPostsPage0 = await apiFetch(`/users/${uRiyaId}/posts?page=0`);
  assert.strictEqual(resUserPostsPage0.status, 400);
  console.log("✅ Step 08 passed!");

  // --- Step 09: GET /posts/:id/likes ---
  console.log("\n[Test 7] Step 09: GET /posts/:id/likes...");
  const resLikesP1 = await apiFetch(`/posts/${p1Id}/likes`);
  const dataLikesP1 = await resLikesP1.json();
  const usersLikesP1 = dataLikesP1.map((u) => u.username);
  assert.deepStrictEqual(usersLikesP1, [
    "arjun_clicks",
    "isha_dances",
    "meera.eats",
    "neha_designs",
    "vikram.trek",
  ]);

  const resLikesP24 = await apiFetch(`/posts/${p24Id}/likes`);
  const dataLikesP24 = await resLikesP24.json();
  const usersLikesP24 = dataLikesP24.map((u) => u.username);
  assert.deepStrictEqual(usersLikesP24, [
    "aditya_codes",
    "arjun_clicks",
    "riya_travels",
    "rohan_runs",
    "sara_sketches",
    "vikram.trek",
  ]);

  const resLikesP05 = await apiFetch(`/posts/${p05Id}/likes`);
  const dataLikesP05 = await resLikesP05.json();
  assert.deepStrictEqual(dataLikesP05, []);

  const resLikesP404 = await apiFetch(`/posts/999999/likes`);
  assert.strictEqual(resLikesP404.status, 404);
  console.log("✅ Step 09 passed!");

  // --- Step 10: POST /posts/:id/likes & DELETE /posts/:id/likes/:userId ---
  console.log("\n[Test 8] Step 10: Like and Unlike...");
  const resLike1 = await apiFetch(`/posts/${p05Id}/likes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: uRiyaId }),
  });
  assert.strictEqual(resLike1.status, 201);
  const dataLike1 = await resLike1.json();
  assert.strictEqual(dataLike1.userId, uRiyaId);
  assert.strictEqual(dataLike1.postId, p05Id);

  const resLikeDup = await apiFetch(`/posts/${p05Id}/likes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: uRiyaId }),
  });
  assert.strictEqual(resLikeDup.status, 409);
  assert.deepStrictEqual(await resLikeDup.json(), { error: "Already liked" });

  const resLikeNoUser = await apiFetch(`/posts/${p05Id}/likes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.strictEqual(resLikeNoUser.status, 400);

  const resLikeNoPost = await apiFetch(`/posts/999999/likes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: uRiyaId }),
  });
  assert.strictEqual(resLikeNoPost.status, 404);
  assert.deepStrictEqual(await resLikeNoPost.json(), { error: "Post not found" });

  const resLikeUser404 = await apiFetch(`/posts/${p05Id}/likes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: 999999 }),
  });
  assert.strictEqual(resLikeUser404.status, 404);
  assert.deepStrictEqual(await resLikeUser404.json(), { error: "User not found" });

  const resPostAfterLike = await apiFetch(`/posts/${p05Id}`);
  const dataPostAfterLike = await resPostAfterLike.json();
  assert.strictEqual(dataPostAfterLike._count.likes, 1);

  const resUnlike = await apiFetch(`/posts/${p05Id}/likes/${uRiyaId}`, {
    method: "DELETE",
  });
  assert.strictEqual(resUnlike.status, 204);

  const resUnlike404 = await apiFetch(`/posts/${p05Id}/likes/${uRiyaId}`, {
    method: "DELETE",
  });
  assert.strictEqual(resUnlike404.status, 404);
  assert.deepStrictEqual(await resUnlike404.json(), { error: "Like not found" });
  console.log("✅ Step 10 passed!");

  // --- Step 11: Cascading deletes ---
  console.log("\n[Test 9] Step 11: Cascading deletes when riya leaves...");
  seedDb();
  const cRiyaId = await getRiyaId();
  const cArjunId = await getArjunId();
  const cInsta10Id = await getInsta10Id();

  const resDelRiya = await apiFetch(`/users/${cRiyaId}`, { method: "DELETE" });
  assert.strictEqual(resDelRiya.status, 204);

  const resUsersAfterDel = await apiFetch(`/users?limit=1`);
  const dataUsersAfterDel = await resUsersAfterDel.json();
  assert.strictEqual(dataUsersAfterDel.meta.total, 11);

  const resPostsAfterDel = await apiFetch(`/posts?limit=1`);
  const dataPostsAfterDel = await resPostsAfterDel.json();
  assert.strictEqual(dataPostsAfterDel.meta.total, 17);

  const resGoaAfterDel = await apiFetch(`/posts?location=goa`);
  const dataGoaAfterDel = await resGoaAfterDel.json();
  assert.strictEqual(dataGoaAfterDel.data.length, 1);
  assert.strictEqual(dataGoaAfterDel.data[0].imageUrl.split("/")[4], "insta10");

  const resSortAfterDel = await apiFetch(`/posts?sortBy=likes&limit=3`);
  const dataSortAfterDel = await resSortAfterDel.json();
  const keysSortAfterDel = dataSortAfterDel.data.map((p) => p.imageUrl.split("/")[4]);
  assert.deepStrictEqual(keysSortAfterDel, ["insta24", "insta15", "insta17"]);

  const resLikesInsta10 = await apiFetch(`/posts/${cInsta10Id}/likes`);
  const dataLikesInsta10 = await resLikesInsta10.json();
  assert.deepStrictEqual(
    dataLikesInsta10.map((u) => u.username),
    ["ananya_reads", "kabir_sings"]
  );

  const resArjunAfterDel = await apiFetch(`/users/${cArjunId}`);
  const dataArjunAfterDel = await resArjunAfterDel.json();
  assert.deepStrictEqual(dataArjunAfterDel._count, { posts: 4, likes: 2 });

  const resRiyaPostsAfterDel = await apiFetch(`/users/${cRiyaId}/posts`);
  assert.strictEqual(resRiyaPostsAfterDel.status, 404);
  console.log("✅ Step 11 passed!");

  // --- Step 12: GET /users/:id/liked-posts ---
  console.log("\n[Test 10] Step 12: GET /users/:id/liked-posts...");
  seedDb();
  const lRiyaId = await getRiyaId();
  const lArjunId = await getArjunId();
  const lNehaId = await getNehaId();

  const resRiyaLiked = await apiFetch(`/users/${lRiyaId}/liked-posts`);
  const dataRiyaLiked = await resRiyaLiked.json();
  assert.deepStrictEqual(
    dataRiyaLiked.data.map((p) => p.imageUrl.split("/")[4]),
    ["insta24", "insta20", "insta10", "insta03"]
  );
  assert.strictEqual(dataRiyaLiked.meta.total, 4);
  assert.strictEqual(dataRiyaLiked.meta.totalPages, 1);

  const resArjunLiked = await apiFetch(`/users/${lArjunId}/liked-posts?limit=2`);
  const dataArjunLiked = await resArjunLiked.json();
  assert.deepStrictEqual(
    dataArjunLiked.data.map((p) => p.imageUrl.split("/")[4]),
    ["insta24", "insta14"]
  );
  assert.strictEqual(dataArjunLiked.meta.total, 4);
  assert.strictEqual(dataArjunLiked.meta.totalPages, 2);

  const resNehaLiked = await apiFetch(`/users/${lNehaId}/liked-posts`);
  const dataNehaLiked = await resNehaLiked.json();
  assert.deepStrictEqual(
    dataNehaLiked.data.map((p) => p.imageUrl.split("/")[4]),
    ["insta22", "insta15", "insta01"]
  );
  assert.strictEqual(dataNehaLiked.meta.total, 3);
  assert.strictEqual(dataNehaLiked.meta.totalPages, 1);

  // New user with 0 liked posts
  const resNewUser = await apiFetch(`/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "fresh_user_0_liked",
      email: "fresh@example.com",
      fullname: "Fresh User",
    }),
  });
  const newUserData = await resNewUser.json();
  const resNewUserLiked = await apiFetch(`/users/${newUserData.id}/liked-posts`);
  const dataNewUserLiked = await resNewUserLiked.json();
  assert.deepStrictEqual(dataNewUserLiked.data, []);
  assert.strictEqual(dataNewUserLiked.meta.total, 0);
  assert.strictEqual(dataNewUserLiked.meta.totalPages, 0);

  const resLiked404 = await apiFetch(`/users/999999/liked-posts`);
  assert.strictEqual(resLiked404.status, 404);
  console.log("✅ Step 12 passed!");

  // Final re-seed
  seedDb();

  console.log("\n🎉 ALL RELATIONS TESTS PASSED SUCCESSFULLY! COMPLETE VERIFICATION DONE!");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
