import assert from "node:assert";

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("--- Starting InstaLite End-to-End Test Suite ---");

  // Step 01: Health check
  console.log("\n[Test 1] Testing GET /health...");
  const resHealth = await fetch(`${BASE_URL}/health`);
  assert.strictEqual(resHealth.status, 200, "Health status should be 200");
  const healthData = await resHealth.json();
  assert.deepStrictEqual(healthData, { status: "OK" }, "Health body should be { status: 'OK' }");
  console.log("✅ GET /health passed!");

  // Step 04: POST /users
  console.log("\n[Test 2] Testing POST /users (missing required fields)...");
  const resMissing = await fetch(`${BASE_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "onlyname" }),
  });
  assert.strictEqual(resMissing.status, 400, "Should return 400 when required fields missing");
  const missingData = await resMissing.json();
  assert.deepStrictEqual(
    missingData,
    { error: "username, email and fullname are required" },
    "Should return exact error message for missing fields"
  );
  console.log("✅ POST /users missing fields validation passed!");

  console.log("\n[Test 3] Testing POST /users (valid creation - riya_travels)...");
  const resRiya = await fetch(`${BASE_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "riya_travels_test",
      email: "riya_test@example.com",
      fullname: "Riya Sharma",
    }),
  });
  assert.strictEqual(resRiya.status, 201, "Should return 201 Created");
  const riyaData = await resRiya.json();
  assert.strictEqual(typeof riyaData.id, "number", "User id should be a number");
  assert.strictEqual(riyaData.username, "riya_travels_test");
  assert.strictEqual(riyaData.email, "riya_test@example.com");
  assert.strictEqual(riyaData.fullname, "Riya Sharma");
  assert.strictEqual(riyaData.bio, null, "bio should default to null");
  assert.strictEqual(riyaData.isPrivate, false, "isPrivate should default to false");
  assert.ok(riyaData.createdAt, "createdAt timestamp must exist");
  assert.ok(riyaData.updatedAt, "updatedAt timestamp must exist");
  const riyaId = riyaData.id;
  console.log(`✅ POST /users created user with id: ${riyaId}`);

  console.log("\n[Test 4] Testing POST /users (duplicate username/email conflict)...");
  const resDup = await fetch(`${BASE_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "riya_travels_test",
      email: "other@example.com",
      fullname: "Copy Cat",
    }),
  });
  assert.strictEqual(resDup.status, 409, "Should return 409 Conflict");
  const dupData = await resDup.json();
  assert.deepStrictEqual(
    dupData,
    { error: "username or email already taken" },
    "Should return exact duplicate error message"
  );
  console.log("✅ POST /users duplicate detection passed!");

  console.log("\n[Test 5] Testing POST /users (ignored fields like id)...");
  const resSneaky = await fetch(`${BASE_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "sneaky_test",
      email: "sneaky_test@example.com",
      fullname: "Sneaky",
      id: 999,
    }),
  });
  assert.strictEqual(resSneaky.status, 201, "Should return 201 Created");
  const sneakyData = await resSneaky.json();
  assert.notStrictEqual(sneakyData.id, 999, "id 999 must be ignored and auto-incremented");
  const sneakyId = sneakyData.id;
  console.log(`✅ POST /users auto-increment passed (id was ${sneakyId}, not 999)!`);

  // Step 05: GET /users
  console.log("\n[Test 6] Testing GET /users...");
  const resListUsers = await fetch(`${BASE_URL}/users`);
  assert.strictEqual(resListUsers.status, 200, "Should return 200 OK");
  const usersList = await resListUsers.json();
  assert.ok(Array.isArray(usersList), "Should return array of users");
  assert.ok(usersList.some((u) => u.id === riyaId), "List should include created user");
  console.log(`✅ GET /users returned ${usersList.length} users!`);

  // Step 06: GET /users/:id
  console.log("\n[Test 7] Testing GET /users/:id (existing and 404)...");
  const resGetUser = await fetch(`${BASE_URL}/users/${riyaId}`);
  assert.strictEqual(resGetUser.status, 200, "Should return 200 OK");
  const singleUser = await resGetUser.json();
  assert.strictEqual(singleUser.id, riyaId);

  const resGetUser404 = await fetch(`${BASE_URL}/users/999999`);
  assert.strictEqual(resGetUser404.status, 404, "Should return 404 for non-existent user");
  const notFoundUser = await resGetUser404.json();
  assert.deepStrictEqual(notFoundUser, { error: "User not found" });
  console.log("✅ GET /users/:id passed (both 200 and 404)!");

  // Step 07: PATCH /users/:id
  console.log("\n[Test 8] Testing PATCH /users/:id...");
  const resPatchUser = await fetch(`${BASE_URL}/users/${riyaId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullname: "Riya S. Sharma",
      bio: "Wanderlust traveler",
      isPrivate: true,
      username: "cannot_change",
      email: "cannot_change@example.com",
    }),
  });
  assert.strictEqual(resPatchUser.status, 200, "Should return 200 OK");
  const patchedUser = await resPatchUser.json();
  assert.strictEqual(patchedUser.fullname, "Riya S. Sharma");
  assert.strictEqual(patchedUser.bio, "Wanderlust traveler");
  assert.strictEqual(patchedUser.isPrivate, true);
  assert.strictEqual(patchedUser.username, "riya_travels_test", "username must be unchanged");
  assert.strictEqual(patchedUser.email, "riya_test@example.com", "email must be unchanged");

  const resPatchUser404 = await fetch(`${BASE_URL}/users/999999`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bio: "hello" }),
  });
  assert.strictEqual(resPatchUser404.status, 404);
  const patchUserNotFound = await resPatchUser404.json();
  assert.deepStrictEqual(patchUserNotFound, { error: "User not found" });
  console.log("✅ PATCH /users/:id passed (both 200 and 404)!");

  // Step 08: DELETE /users/:id
  console.log("\n[Test 9] Testing DELETE /users/:id...");
  const resDeleteUser = await fetch(`${BASE_URL}/users/${sneakyId}`, {
    method: "DELETE",
  });
  assert.strictEqual(resDeleteUser.status, 204, "Should return 204 No Content");
  const deleteText = await resDeleteUser.text();
  assert.strictEqual(deleteText, "", "Response body should be empty");

  const resDeleteUser404 = await fetch(`${BASE_URL}/users/${sneakyId}`, {
    method: "DELETE",
  });
  assert.strictEqual(resDeleteUser404.status, 404, "Second delete should return 404");
  const delUserNotFound = await resDeleteUser404.json();
  assert.deepStrictEqual(delUserNotFound, { error: "User not found" });
  console.log("✅ DELETE /users/:id passed (both 204 and 404)!");

  // Step 13: POST /posts
  console.log("\n[Test 10] Testing POST /posts (missing imageUrl)...");
  const resMissingPost = await fetch(`${BASE_URL}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ caption: "Missing url" }),
  });
  assert.strictEqual(resMissingPost.status, 400, "Should return 400 when imageUrl is missing");
  const missingPostData = await resMissingPost.json();
  assert.deepStrictEqual(missingPostData, { error: "imageUrl is required" });
  console.log("✅ POST /posts missing imageUrl validation passed!");

  console.log("\n[Test 11] Testing POST /posts (valid creation)...");
  const resPost = await fetch(`${BASE_URL}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageUrl: "https://example.com/mountain.jpg",
      caption: "Serene Mountains",
      location: "Himalayas",
      id: 999,
    }),
  });
  assert.strictEqual(resPost.status, 201, "Should return 201 Created");
  const postData = await resPost.json();
  assert.strictEqual(typeof postData.id, "number");
  assert.notStrictEqual(postData.id, 999, "id 999 must be ignored");
  assert.strictEqual(postData.imageUrl, "https://example.com/mountain.jpg");
  assert.strictEqual(postData.caption, "Serene Mountains");
  assert.strictEqual(postData.location, "Himalayas");
  assert.ok(postData.createdAt);
  assert.ok(postData.updatedAt);
  const postId = postData.id;
  console.log(`✅ POST /posts created post with id: ${postId}!`);

  // Step 14: GET /posts
  console.log("\n[Test 12] Testing GET /posts...");
  const resListPosts = await fetch(`${BASE_URL}/posts`);
  assert.strictEqual(resListPosts.status, 200, "Should return 200 OK");
  const postsList = await resListPosts.json();
  assert.ok(Array.isArray(postsList));
  assert.ok(postsList.some((p) => p.id === postId));
  console.log(`✅ GET /posts returned ${postsList.length} posts!`);

  // Step 15: GET /posts/:id
  console.log("\n[Test 13] Testing GET /posts/:id...");
  const resGetPost = await fetch(`${BASE_URL}/posts/${postId}`);
  assert.strictEqual(resGetPost.status, 200);
  const singlePost = await resGetPost.json();
  assert.strictEqual(singlePost.id, postId);

  const resGetPost404 = await fetch(`${BASE_URL}/posts/999999`);
  assert.strictEqual(resGetPost404.status, 404);
  const notFoundPost = await resGetPost404.json();
  assert.deepStrictEqual(notFoundPost, { error: "Post not found" });
  console.log("✅ GET /posts/:id passed (both 200 and 404)!");

  // Step 16: PATCH /posts/:id
  console.log("\n[Test 14] Testing PATCH /posts/:id...");
  const resPatchPost = await fetch(`${BASE_URL}/posts/${postId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      caption: "Updated Himalayas caption",
      location: "Ladakh",
      imageUrl: "https://attempt-to-overwrite.com/pic.jpg",
    }),
  });
  assert.strictEqual(resPatchPost.status, 200);
  const patchedPost = await resPatchPost.json();
  assert.strictEqual(patchedPost.caption, "Updated Himalayas caption");
  assert.strictEqual(patchedPost.location, "Ladakh");
  assert.strictEqual(
    patchedPost.imageUrl,
    "https://example.com/mountain.jpg",
    "imageUrl must NOT be editable"
  );

  const resPatchPost404 = await fetch(`${BASE_URL}/posts/999999`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ caption: "test" }),
  });
  assert.strictEqual(resPatchPost404.status, 404);
  const patchPostNotFound = await resPatchPost404.json();
  assert.deepStrictEqual(patchPostNotFound, { error: "Post not found" });
  console.log("✅ PATCH /posts/:id passed (both 200 and 404)!");

  // Step 17: DELETE /posts/:id
  console.log("\n[Test 15] Testing DELETE /posts/:id...");
  const resDeletePost = await fetch(`${BASE_URL}/posts/${postId}`, {
    method: "DELETE",
  });
  assert.strictEqual(resDeletePost.status, 204);
  const delPostText = await resDeletePost.text();
  assert.strictEqual(delPostText, "");

  const resDeletePost404 = await fetch(`${BASE_URL}/posts/${postId}`, {
    method: "DELETE",
  });
  assert.strictEqual(resDeletePost404.status, 404);
  const delPostNotFound = await resDeletePost404.json();
  assert.deepStrictEqual(delPostNotFound, { error: "Post not found" });
  console.log("✅ DELETE /posts/:id passed (both 204 and 404)!");

  // Clean up riya user
  await fetch(`${BASE_URL}/users/${riyaId}`, { method: "DELETE" });

  console.log("\n🎉 ALL 15 TESTS PASSED SUCCESSFULLY! FULL SEQUENCE VERIFIED!");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
