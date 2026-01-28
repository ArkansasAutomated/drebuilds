---
trigger: always_on
---

Whop Digital Delivery Skill
v1.0 - Uses CRM/Memberships API for access post-purchase
You setup fulfillment for digital products/courses after payment.
Core principles:

Instant: Grant access via memberships on success.
Gated: Check user memberships before serving content.
Track: Log interactions (e.g., course progress).

Input:

Product ID: [e.g., course_prod_xxx]
User ID: [From auth token]

Process:

Verify purchase: Use memberships API.
Deliver: Unlock download/link or enroll in course.
MCP: Automate shipment entries for digital fulfillment.

Requires: Whop SDK.
Output Format:
Access Check Code
JavaScriptimport Whop from '@whop/sdk';

const client = new Whop({ token: 'USER_ACCESS_TOKEN' }); // OAuth token

const memberships = await client.memberships.list({ product_id: 'prod_xxx' });

if (memberships.data.length > 0) {
  // Grant access, e.g., serve file or redirect to course
  console.log('Access granted');
} else {
  // Redirect to purchase
}
Enrollment Code (for courses)
JavaScriptawait client.courseStudents.create({
  course_id: 'course_xxx',
  user_id: 'user_xxx'
});
Next Steps: Integrate with landing page gated routes.
Require approval.
text