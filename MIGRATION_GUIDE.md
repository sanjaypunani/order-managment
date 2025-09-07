# Order-Customer Database Normalization Migration Guide

This guide will help you migrate your MongoDB database from a denormalized structure (where customer details are stored in each order) to a normalized structure (where orders reference customers by ID).

## 📋 Current Issue

Your current order structure stores customer data directly:

```json
{
  "_id": "...",
  "customerNumber": "+91 9978543506",
  "flatNumber": "B-1104",
  "socityName": "The Vienza",
  "customerName": "John Doe",
  "status": "Pending",
  "discount": 100,
  "totalAmount": 160,
  "finalAmount": 60,
  "deliveryDate": "2025-08-03",
  "items": [...]
}
```

## 🎯 Target Structure

After migration:

**Orders Collection:**

```json
{
  "_id": "...",
  "customerId": ObjectId("..."), // Reference to customer
  "status": "Pending",
  "discount": 100,
  "totalAmount": 160,
  "finalAmount": 60,
  "deliveryDate": "2025-08-03",
  "items": [...]
}
```

**Customers Collection:**

```json
{
  "_id": ObjectId("..."),
  "customerName": "John Doe",
  "mobileNumber": "9978543506",
  "countryCode": "+91",
  "flatNumber": "B-1104",
  "societyName": "The Vienza",
  "address": "B-1104, The Vienza",
  "walletBalance": 0,
  "createdAt": "2025-01-24T...",
  "updatedAt": "2025-01-24T..."
}
```

## 🚀 Migration Steps

### Step 1: Run the Migration Script

```bash
npm run migrate:normalize
```

This script will:

- ✅ **Create a backup** of your current database
- ✅ **Extract unique customers** from all orders
- ✅ **Create/update customers** in the customers collection
- ✅ **Add customer IDs** to orders (keeps old fields as backup)
- ✅ **Verify** the migration was successful

### Step 2: Test Your Application

After the migration:

1. **Test order creation** with customer selection
2. **Test order editing** and customer updates
3. **Verify customer search** functionality works
4. **Check reports and analytics** that use customer data

### Step 3: Update Application Code (If Needed)

The migration script keeps the old customer fields in orders as backup. Update your code to use `customerId` instead of denormalized fields:

**Before:**

```typescript
// Getting customer info from order
const customerName = order.customerName;
const flatNumber = order.flatNumber;
```

**After:**

```typescript
// Getting customer info via reference
const customer = await customersCollection.findOne({ _id: order.customerId });
const customerName = customer.customerName;
const flatNumber = customer.flatNumber;
```

### Step 4: Clean Up (After Testing)

Once you've verified everything works correctly:

```bash
npm run migrate:cleanup
```

This removes the old denormalized customer fields from orders.

## 🔄 Rollback (If Needed)

If you need to rollback the migration:

```bash
npm run migrate:rollback
```

This will:

- Restore denormalized customer fields in orders
- Remove customer ID references
- Return to the original structure

## 📁 Backup Files

All migration scripts create timestamped backups in the `backups/` directory:

- `db-backup-[timestamp].json` - Full database backup before migration
- `pre-cleanup-backup-[timestamp].json` - Backup before cleanup

## 🔍 Verification Commands

Check migration status:

```bash
# Connect to MongoDB and check
db.orders.find({ customerId: { $exists: true } }).count()  // Should equal total orders
db.orders.find({ customerId: { $exists: false } }).count() // Should be 0
db.customers.find({}).count() // Should show your unique customers
```

## ⚠️ Important Notes

1. **Always backup** before running migration scripts
2. **Test thoroughly** before running cleanup
3. **Run during low traffic** periods
4. **Keep backups** until you're confident the migration is successful
5. **Update application code** to use customer references instead of denormalized data

## 🛠 Available Scripts

| Command                     | Description                            |
| --------------------------- | -------------------------------------- |
| `npm run migrate:normalize` | Run the main migration (with backup)   |
| `npm run migrate:cleanup`   | Remove old customer fields from orders |
| `npm run migrate:rollback`  | Rollback to denormalized structure     |

## 🎉 Benefits After Migration

1. **Data Consistency** - Customer info stored in one place
2. **Easier Updates** - Change customer info once, reflects everywhere
3. **Better Performance** - Smaller order documents
4. **Simplified Queries** - Use joins for customer data
5. **Scalability** - Proper database normalization

## 🆘 Support

If you encounter issues:

1. Check the backup files in `backups/` directory
2. Review console logs from migration scripts
3. Use rollback if needed: `npm run migrate:rollback`
4. Verify your `.env.local` has correct MongoDB connection string

## ✅ Migration Checklist

- [ ] Read this guide thoroughly
- [ ] Ensure `.env.local` has correct MongoDB URI
- [ ] Stop your application during migration
- [ ] Run `npm run migrate:normalize`
- [ ] Verify backup files were created
- [ ] Test your application functionality
- [ ] Update code to use customer IDs if needed
- [ ] Run `npm run migrate:cleanup` after testing
- [ ] Update deployment/production when ready
