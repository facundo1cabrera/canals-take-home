import { prisma } from '../src/index.js';

async function main() {
  console.log('Starting seed...');

  const customer1 = await prisma.customer.upsert({
    where: { id: '11111111-1111-1111-1111-111111111111' },
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Alice Customer',
      email: 'alice@example.com',
    },
    update: {},
  });

  const customer2 = await prisma.customer.upsert({
    where: { id: '22222222-2222-2222-2222-222222222222' },
    create: {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Bob Customer',
      email: 'bob@example.com',
    },
    update: {},
  });

  const product1 = await prisma.product.upsert({
    where: { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
    create: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'Widget A',
      price: 1999,
    },
    update: {},
  });

  const product2 = await prisma.product.upsert({
    where: { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' },
    create: {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      name: 'Widget B',
      price: 2950,
    },
    update: {},
  });

  const warehouse1 = await prisma.warehouse.upsert({
    where: { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc' },
    create: {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      name: 'Warehouse North',
      latitude: 40.7128,
      longitude: -74.006,
    },
    update: {},
  });

  const warehouse2 = await prisma.warehouse.upsert({
    where: { id: 'dddddddd-dddd-dddd-dddd-dddddddddddd' },
    create: {
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      name: 'Warehouse South',
      latitude: 34.0522,
      longitude: -118.2437,
    },
    update: {},
  });

  await prisma.inventory.upsert({
    where: {
      warehouseId_productId: {
        warehouseId: warehouse1.id,
        productId: product1.id,
      },
    },
    create: {
      warehouseId: warehouse1.id,
      productId: product1.id,
      quantity: 100,
    },
    update: { quantity: 100 },
  });

  await prisma.inventory.upsert({
    where: {
      warehouseId_productId: {
        warehouseId: warehouse1.id,
        productId: product2.id,
      },
    },
    create: {
      warehouseId: warehouse1.id,
      productId: product2.id,
      quantity: 50,
    },
    update: { quantity: 50 },
  });

  await prisma.inventory.upsert({
    where: {
      warehouseId_productId: {
        warehouseId: warehouse2.id,
        productId: product1.id,
      },
    },
    create: {
      warehouseId: warehouse2.id,
      productId: product1.id,
      quantity: 80,
    },
    update: { quantity: 80 },
  });

  await prisma.inventory.upsert({
    where: {
      warehouseId_productId: {
        warehouseId: warehouse2.id,
        productId: product2.id,
      },
    },
    create: {
      warehouseId: warehouse2.id,
      productId: product2.id,
      quantity: 60,
    },
    update: { quantity: 60 },
  });

  console.log('Seeded customers:', customer1.id, customer2.id);
  console.log('Seeded products:', product1.id, product2.id);
  console.log('Seeded warehouses:', warehouse1.id, warehouse2.id);
  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
