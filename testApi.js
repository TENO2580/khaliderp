const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

async function main() {
  const u = await prisma.user.findFirst();
  const token = jwt.sign({userId: u.id, role: u.role}, process.env.JWT_SECRET || 'tripidio-jwt-secret-key-change-in-production-2026');
  
  const res = await fetch('http://localhost:3000/api/customers?startDate=2026-08-11&endDate=2026-08-11', {
    headers: { authorization: 'Bearer ' + token }
  });
  const data = await res.json();
  console.log('Total returned:', data.data?.pagination?.total || data.data?.length || data.length);
}
main().finally(() => process.exit(0));
