# Admin Moderation Guide

This guide explains how to use the admin moderation dashboard to review and approve community contributions.

## Access the Admin Panel

The admin moderation dashboard is available at:

```
https://your-app-domain/admin/moderation?token=YOUR_ADMIN_API_TOKEN
```

### Getting Your Admin Token

Your `ADMIN_API_TOKEN` is set in environment variables. It's required to access the moderation dashboard.

In development, check your `.env.local` file:
```
ADMIN_API_TOKEN=your_secret_token_here
```

In production, it's set in Vercel environment variables.

## Dashboard Features

### View Pending Claims

The dashboard shows all pending claims in a feed:
- **Figure Change Requests** — Proposed changes to existing figures
- **Figure Info Submissions** — New figure information submissions

Each claim shows:
- Submission time and confidence score
- Current vs. proposed values
- Submitter information and source
- Match candidates (for figure info)

### Approve Changes

1. Review the claim details
2. Click the **Approve** button
3. Confirm the action
4. The change is immediately applied to the database

For **figure change requests**, the specific field is updated:
- `base_buck` - Updates the figure's base buck designation
- `name` - Updates the figure's display name
- `year` - Updates the figure's release year
- `line_name` - _(Not implemented; requires line_id mapping)_

For **figure info submissions**, the claim is marked as approved for manual review.

### Reject Claims

1. Review the claim details
2. Click the **Reject** button
3. Confirm the action
4. The claim is marked as rejected (not deleted)

Rejected claims are still stored in the database for audit purposes.

## Workflow: Figure Change Request

Example workflow for approving a base_buck correction:

1. User submits a figure change request:
   - Figure: "Vulcan" (Marvel Legends)
   - Field: `base_buck`
   - Current: `unique`
   - Proposed: `Vulcan Buck`

2. In admin dashboard:
   - Review the current value ("unique") vs. proposed ("Vulcan Buck")
   - Check the submitter and source information
   - Click **Approve**

3. Result:
   - The figure's `base_buck` is updated to "Vulcan Buck" in the database
   - The claim is marked as `approved_and_applied`
   - The change is immediately visible to all users

## Workflow: Figure Info Submission

Example workflow for reviewing new figure information:

1. User submits figure information:
   - Name: "Storm"
   - Base Buck: "Storm Buck"
   - Year: 2024
   - Line: "Marvel Legends"
   - Image: (uploaded)

2. In admin dashboard:
   - Review the submitted information
   - Check match candidates (if any)
   - Click **Approve** (marks as approved for later processing)

3. Result:
   - The claim is marked as approved
   - Later, an admin can choose to:
     - Create a new figure from this data
     - Link it to an existing figure
     - Request clarification

## Best Practices

### Review Before Approving

- Check the **source** field to verify credibility
- Review **confidence scores** — higher scores indicate better matches
- Verify the proposed value is reasonable and accurate
- Check for **duplicate submissions** before approving

### Audit Trail

All claims are stored with:
- Submission timestamp
- Submitter information
- Admin review status
- Review timestamp

This creates a complete audit trail of all contributions and approvals.

### Handling Disputes

If you reject a claim:
1. The submitter can resubmit with corrections
2. Rejected claims are kept for historical reference
3. Multiple submissions for the same figure may indicate a data quality issue

## Troubleshooting

### "Invalid admin token"
- Verify the token in your `.env.local` (dev) or Vercel (prod)
- Token is case-sensitive
- Don't share your token publicly

### Changes not appearing immediately
- The database is updated directly
- Refresh the page or restart your app to see changes
- Check the figure detail page to confirm

### No pending claims showing
- This is normal! All submissions may have been reviewed
- New submissions will appear here automatically

## Security

The admin panel requires the `ADMIN_API_TOKEN` for all operations:
- GET requests to fetch claims require the token
- POST requests to approve/reject require the token
- Rate limiting is enforced to prevent abuse

Never share your admin token. It should only be known to trusted moderators.

---

**Questions?** Check the main [DEPLOYMENT_CLOUDFLARE_VERCEL.md](DEPLOYMENT_CLOUDFLARE_VERCEL.md) for complete setup instructions.
