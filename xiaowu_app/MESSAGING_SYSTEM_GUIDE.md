# Messaging System Implementation Guide

## Overview
Complete implementation of the messaging system with all 8 API endpoints (18a-18h) including text messages, payment requests, transfers, and notifications.

## API Endpoints Implemented

### 18a) POST /api/user/messages
**Send a message**
- Endpoint: `/api/user/messages`
- Auth: `auth:sanctum`, `role=user`
- Request body:
  - `receiver_id` (required integer)
  - `message_text` (required string, max 2000)
  - `product_id` (optional integer)
- Response 201: Message sent successfully with conversation_id and message_data
- Errors: 403 (unauthorized), 422 (validation/receiver is sender)

### 18b) GET /api/user/messages
**Get messages for a conversation**
- Endpoint: `/api/user/messages`
- Auth: `auth:sanctum`, `role=user`
- Query params:
  - `conversation_id` (required integer)
  - `limit` (optional integer 1-100, default 50)
  - `before_id` (optional integer for pagination)
- Side effect: Marks unread messages as read
- Response 200: Conversation details and messages array
- Errors: 403 (not part of conversation), 422 (validation)

### 18c) GET /api/user/messages/notification
**Get message and payment notifications**
- Endpoint: `/api/user/messages/notification`
- Auth: `auth:sanctum`, `role=user`
- Query params:
  - `limit` (optional integer 1-100, default 20)
- Response 200: Total count and notifications array
- Includes both message notifications and wallet transfer notifications
- Errors: 403 (unauthorized), 422 (validation)

### 18d) GET /api/user/messages/contacts
**Get message contacts**
- Endpoint: `/api/user/messages/contacts`
- Auth: `auth:sanctum`, `role=user`
- Query params:
  - `limit` (optional integer 1-100, default 20)
- Response 200: Users who have sent/received messages with current user
- Errors: 403 (unauthorized), 422 (validation)

### 18e) GET /api/user/messages/view_message
**Get latest message per conversation**
- Endpoint: `/api/user/messages/view_message`
- Auth: `auth:sanctum`, `role=user`
- Query params:
  - `limit` (optional integer 1-100, default 20)
- Response 200: Latest message details for each conversation with sender info
- Used for conversation list view
- Errors: 403 (unauthorized), 422 (validation)

### 18f) POST /api/user/messages/transfer
**Transfer money in conversation**
- Endpoint: `/api/user/messages/transfer`
- Auth: `auth:sanctum`, `role=user`
- Request body:
  - `conversation_id` (required integer)
  - `amount` (required numeric >= 0.01)
  - `currency` (required string size 3, e.g., "CNY", "USD")
  - `reference` (optional string max 255)
- Behavior:
  - Validates both users have primary wallets with matching currency
  - Checks sender has sufficient balance
  - Creates atomic transaction with debit/credit ledger entries
  - Updates wallet balances
  - Creates transfer message in conversation
- Response 200: Transfer details
- Errors: 404 (conversation/wallet not found), 409 (wallet issues/insufficient balance), 422 (validation), 403 (unauthorized)

### 18g) POST /api/user/payment-requests
**Create payment request**
- Endpoint: `/api/user/payment-requests`
- Auth: `auth:sanctum`, `role=user`
- Request body:
  - `conversation_id` (required integer)
  - `amount` (required numeric >= 0.01)
  - `currency` (required string size 3)
  - `product_id` (optional integer)
  - `message` (optional string max 1000)
  - `expires_in_hours` (optional integer 1-720, default 24)
- Behavior:
  - Creates payment_requests record with status "pending"
  - Creates message with type "payment_request"
  - Product must belong to conversation participant
  - Auto-calculates expiration time
- Response 201: Payment request details
- Errors: 404 (conversation/product not found), 409 (product not related), 422 (validation), 403 (unauthorized)

### 18h) POST /api/user/payment-requests/{request_id}/confirm
**Confirm and pay payment request**
- Endpoint: `/api/user/payment-requests/{request_id}/confirm`
- Auth: `auth:sanctum`, `role=user`
- Path params:
  - `request_id` (required integer)
- Behavior:
  - Validates user is receiver
  - Checks request is pending and not expired
  - Validates wallets and balance
  - Creates atomic transaction
  - Updates payment request status to "paid"
  - Creates payment confirmation message
  - Updates original payment request message
  - Marks associated product as "sold" if product_id exists
- Response 200: Payment details
- Errors: 403 (not receiver/unauthorized), 404 (request/wallet not found), 409 (already paid/expired/wallet issues), 422 (validation)

## File Structure

### Services
- `src/services/messageService.ts` - All messaging API calls
  - `sendMessage()` - Send text/product mention messages
  - `getMessages()` - Fetch conversation messages
  - `getMessageNotifications()` - Fetch notifications
  - `getMessageContacts()` - Fetch contacts list
  - `getViewMessages()` - Fetch conversation previews
  - `transferMoney()` - Send money transfer
  - `createPaymentRequest()` - Create payment request
  - `confirmPaymentRequest()` - Confirm payment

### Components
- `app/(tabs)/messages.tsx` - Main messages screen
  - Two tabs: Chats and Notifications
  - Real-time notification polling (30s interval)
  - Unread count badge
  - Pull-to-refresh support
  
- `app/chat/[id].tsx` - Chat conversation screen
  - Real-time message updates (5s interval)
  - Send text messages
  - Display payment requests with "Pay Now" button
  - Display transfers and payment confirmations
  - Display product mentions
  - Transfer money modal
  - Request payment modal
  - Support for new conversations (id=0)

- `src/components/ui/NotificationBadge.tsx` - Badge component for unread counts

### Hooks
- `src/hooks/useMessageNotifications.ts` - Custom hook for notification management
  - Auto-polling notifications
  - Unread count tracking
  - Manual refresh support

## Features Implemented

### 1. Text Messaging
- Send and receive text messages
- Real-time message updates
- Message read status tracking
- Conversation threading

### 2. Product Mentions
- Send product references in messages
- Display product cards in chat
- Navigate to product details from chat
- Auto-attach product when messaging from product page

### 3. Money Transfers
- Send money directly in conversation
- Currency selection (CNY, USD, etc.)
- Optional reference/note
- Transfer confirmation messages
- Real-time balance updates

### 4. Payment Requests
- Create payment requests with amount and currency
- Optional product reference
- Expiration time (default 24 hours)
- Custom message support
- Receiver can pay with one tap
- Auto-mark product as sold on payment
- Status tracking (pending/paid)

### 5. Notifications
- Separate notifications tab
- Message notifications
- Payment/transfer notifications
- Unread count badge
- Auto-refresh every 30 seconds
- Navigate to conversation or wallet from notification

### 6. Conversation Management
- List all conversations
- Show last message preview
- Display sender info and avatar
- Time formatting (relative for recent, date for old)
- Pull-to-refresh
- Empty states

### 7. UI/UX Features
- Message bubbles (sender vs receiver)
- Payment request cards with action buttons
- Transfer confirmation cards
- Product mention cards
- Loading states
- Error handling with user-friendly messages
- Keyboard-aware input
- Auto-scroll to latest message
- Modal dialogs for transfers and payment requests

## Usage Examples

### Starting a New Conversation
```typescript
// From product detail page
router.push({
  pathname: `/chat/0`,
  params: {
    receiverId: sellerId,
    receiverName: sellerName,
    productId: productId,
  },
});
```

### Sending a Message
```typescript
await sendMessage({
  receiver_id: 123,
  message_text: "Is this still available?",
  product_id: 456, // optional
});
```

### Transferring Money
```typescript
await transferMoney({
  conversation_id: 789,
  amount: 50.00,
  currency: "CNY",
  reference: "Payment for textbook",
});
```

### Creating Payment Request
```typescript
await createPaymentRequest({
  conversation_id: 789,
  amount: 45.00,
  currency: "CNY",
  product_id: 456,
  message: "Payment for Calculus textbook",
  expires_in_hours: 48,
});
```

### Confirming Payment
```typescript
await confirmPaymentRequest(requestId);
```

## Message Types

### Text Message
- `message_type`: "text"
- Display: Standard chat bubble
- Contains: message_text

### Payment Request
- `message_type`: "payment_request"
- `payment_request_status`: "pending" | "paid"
- Display: Yellow card with "Pay Now" button (if pending and receiver)
- Contains: amount, currency, message, expires_at

### Payment Confirmation
- `message_type`: "payment_confirmation"
- Display: Blue card with checkmark
- Contains: amount, currency, reference

### Transfer
- `message_type`: "transfer"
- Display: Blue card with transfer icon
- Contains: amount, currency, reference, sender info

### Product Mention
- `message_type`: "product_mention"
- Display: White card with product info
- Contains: product title, price, currency
- Tappable to view product details

## Security Features

1. **Authentication**: All endpoints require `auth:sanctum` middleware
2. **Authorization**: Role-based access (user role required)
3. **Validation**: 
   - Receiver cannot be sender
   - Amount validation (>= 0.01)
   - Currency format validation (3 characters)
   - Message length limits (2000 chars for messages, 1000 for payment notes)
4. **Wallet Security**:
   - Balance checks before transfers
   - Atomic transactions (all-or-nothing)
   - Currency matching validation
   - Wallet status validation (active)
5. **Payment Request Security**:
   - Expiration time limits
   - Status validation (prevent double payment)
   - Receiver verification
   - Product ownership validation

## Error Handling

All API calls include comprehensive error handling:
- Network errors
- Validation errors (422)
- Authorization errors (403)
- Not found errors (404)
- Conflict errors (409)
- User-friendly error messages displayed via Alert

## Performance Optimizations

1. **Polling Intervals**:
   - Messages: 5 seconds (only when chat is open)
   - Notifications: 30 seconds (background)
   
2. **Pagination**:
   - Default limit: 50 messages, 20 notifications
   - Support for `before_id` pagination
   
3. **Optimistic Updates**:
   - Messages appear immediately before API confirmation
   - Rollback on error
   
4. **Cleanup**:
   - Intervals cleared on component unmount
   - Proper memory management

## Testing Checklist

- [ ] Send text message
- [ ] Receive text message
- [ ] Send message with product mention
- [ ] Create payment request
- [ ] Confirm payment request
- [ ] Transfer money
- [ ] View notifications
- [ ] Navigate from notification to chat
- [ ] Navigate from notification to wallet
- [ ] Start new conversation from product page
- [ ] View conversation list
- [ ] Pull to refresh conversations
- [ ] Pull to refresh notifications
- [ ] Handle expired payment requests
- [ ] Handle insufficient balance
- [ ] Handle network errors
- [ ] Test with multiple currencies
- [ ] Test message pagination
- [ ] Test real-time updates

## Future Enhancements

1. Push notifications integration
2. Image/file attachments in messages
3. Voice messages
4. Message search
5. Archive conversations
6. Block users
7. Report inappropriate messages
8. Message reactions
9. Typing indicators
10. Read receipts
11. Group conversations
12. Message forwarding
13. Delete messages
14. Edit messages (within time limit)
15. Message templates
