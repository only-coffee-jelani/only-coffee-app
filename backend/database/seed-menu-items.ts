import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { MenuItem, MenuCategory } from '../shared/src/database/entities';
import { Store } from '../shared/src/database/entities';

// Load environment variables
config();

// Create a data source without synchronization
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'only_coffee',
  entities: [join(__dirname, '../shared/src/database/entities', '*.entity.{ts,js}')],
  migrations: [join(__dirname, '../shared/src/database/migrations', '*.{ts,js}')],
  synchronize: false, // Disable synchronization for seeding
  logging: process.env.DB_LOGGING === 'true',
  ssl: process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  extra: {
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    min: parseInt(process.env.DB_POOL_MIN || '2'),
  }
});

const menuItemsData = [
  // Hot Coffee
  {
    name: 'Small Black / Espresso',
    category: MenuCategory.HOT_COFFEE,
    description: 'Classic single shot espresso.',
    basePrice: 2.50,
  },
  {
    name: 'Piccolo',
    category: MenuCategory.HOT_COFFEE,
    description: 'Small espresso with a touch of milk.',
    basePrice: 3.50,
  },
  {
    name: 'Small Brown / Cortado / Macchiato',
    category: MenuCategory.HOT_COFFEE,
    description: 'Espresso with a small amount of milk (FG).',
    basePrice: 3.50,
  },
  {
    name: 'Vienna Melange / Cappuccino',
    category: MenuCategory.HOT_COFFEE,
    description: 'Classic cappuccino style with foamed milk.',
    basePrice: 4.50,
  },
  {
    name: 'Flat White',
    category: MenuCategory.HOT_COFFEE,
    description: 'Smooth espresso with velvety milk.',
    basePrice: 5.50,
  },
  {
    name: 'Latte',
    category: MenuCategory.HOT_COFFEE,
    description: 'Espresso with steamed milk.',
    basePrice: 5.00,
  },
  {
    name: 'Thomas Coffee Latte',
    category: MenuCategory.HOT_COFFEE,
    description: 'Latte with double espresso (FG).',
    basePrice: 6.00,
  },
  {
    name: 'Einspänner',
    category: MenuCategory.HOT_COFFEE,
    description: 'Double espresso with whipped cream (FG).',
    basePrice: 6.00,
  },
  {
    name: 'Ethiopia Doppio',
    category: MenuCategory.HOT_COFFEE,
    description: 'Single-origin Ethiopian espresso double shot.',
    basePrice: 5.50,
  },
  {
    name: 'Ethiopia Flat White',
    category: MenuCategory.HOT_COFFEE,
    description: 'Ethiopian espresso with velvety milk.',
    basePrice: 6.50,
  },
  {
    name: 'Brewed Coffee (Small)',
    category: MenuCategory.HOT_COFFEE,
    description: 'Classic brewed coffee.',
    basePrice: 4.00,
  },
  {
    name: 'Brewed Coffee (Large)',
    category: MenuCategory.HOT_COFFEE,
    description: 'Classic brewed coffee, large.',
    basePrice: 5.00,
  },
  // Cold Brew
  {
    name: 'King Kong Cold Brew (Large)',
    category: MenuCategory.COLD_BREW,
    description: 'Smooth cold brewed coffee.',
    basePrice: 5.50,
  },
  // Signature
  {
    name: 'Salted Caramel Espresso Macchiato',
    category: MenuCategory.SIGNATURE,
    description: 'Double espresso with milk and real salted caramel (FG).',
    basePrice: 6.00,
  },
  {
    name: 'Cappuccino Marshmallow Fluff',
    category: MenuCategory.SIGNATURE,
    description: 'Cappuccino with marshmallow topping.',
    basePrice: 6.00,
  },
  {
    name: 'Honey Latte Macchiato',
    category: MenuCategory.SIGNATURE,
    description: 'Single shot espresso with lots of milk and honey syrup (FG).',
    basePrice: 6.00,
  },
  {
    name: 'Orangeccino',
    category: MenuCategory.SIGNATURE,
    description: 'Double espresso with fresh pressed orange juice.',
    basePrice: 7.00,
  },
  {
    name: 'Kaffee Latte with Oreo',
    category: MenuCategory.SIGNATURE,
    description: 'Single shot espresso with milk and crushed Oreo cookies (FGCA).',
    basePrice: 7.00,
  },
  {
    name: 'Waffolino',
    category: MenuCategory.SIGNATURE,
    description: 'Single espresso shot and foamed milk in a waffle cone (FCGA).',
    basePrice: 9.50,
  },
  {
    name: 'Waffolino con Pistacchio',
    category: MenuCategory.SIGNATURE,
    description: 'Single espresso shot and foamed milk in pistachio waffle cone (FCGA).',
    basePrice: 12.50,
  },
  {
    name: 'Affogato',
    category: MenuCategory.SIGNATURE,
    description: 'One scoop of creamy ice cream with double espresso.',
    basePrice: 6.50,
  },
  {
    name: 'Waffolino Affogato',
    category: MenuCategory.SIGNATURE,
    description: 'Double espresso shot with a scoop of ice cream in a waffle cone.',
    basePrice: 11.50,
  },
  // Seasonal Specials
  {
    name: 'Espresso-Tonic',
    category: MenuCategory.SEASONAL_SPECIALS,
    description: 'Double espresso with a bottle of Fever Tree tonic water, no alcohol.',
    basePrice: 8.50,
  },
  // Chocolate
  {
    name: 'Hot Chocolate (Small)',
    category: MenuCategory.CHOCOLATE,
    description: 'Classic hot chocolate.',
    basePrice: 4.00,
  },
  {
    name: 'Hot Chocolate (Large)',
    category: MenuCategory.CHOCOLATE,
    description: 'Classic hot chocolate, large.',
    basePrice: 5.00,
  },
  // Ice Cream
  {
    name: 'Softice / Softeis',
    category: MenuCategory.ICE_CREAM,
    description: 'NUR Vanilla, the best vanilla ice cream in town.',
    basePrice: 5.00,
  },
  // Add-Ons
  {
    name: 'Extra Espresso Shot',
    category: MenuCategory.ADD_ONS,
    description: 'Add an extra shot to any coffee drink.',
    basePrice: 1.50,
  },
  {
    name: 'Extra Oatly Hafer "Milk"',
    category: MenuCategory.ADD_ONS,
    description: 'Add oat milk.',
    basePrice: 0.50,
  },
  {
    name: 'Extra Soy or Coconut "Milk"',
    category: MenuCategory.ADD_ONS,
    description: 'Add soy or coconut milk.',
    basePrice: 0.50,
  },
  {
    name: 'Extra Lactose-Free Milk',
    category: MenuCategory.ADD_ONS,
    description: 'Add lactose-free milk.',
    basePrice: 0.50,
  },
];

async function seedMenuItems() {
  try {
    // Initialize data source
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const storeRepository = AppDataSource.getRepository(Store);
    const menuItemRepository = AppDataSource.getRepository(MenuItem);

    // Get all stores
    const stores = await storeRepository.find();

    if (stores.length === 0) {
      console.log('No stores found. Please create stores first.');
      return;
    }

    console.log(`Found ${stores.length} stores. Clearing existing menu items...`);

    // Clear existing menu items
    await menuItemRepository.createQueryBuilder().delete().from(MenuItem).execute();
    console.log('✅ Cleared existing menu items');

    console.log(`Seeding menu items for all ${stores.length} stores...`);

    let totalSeeded = 0;

    // Insert menu items for each store using raw SQL
    for (let sortOrder = 0; sortOrder < menuItemsData.length; sortOrder++) {
      const itemData = menuItemsData[sortOrder] as any;

      // Create the item for each store
      for (const store of stores) {
        await AppDataSource.query(
          `INSERT INTO menu_items (
            "storeId", "toastItemId", "name", "description", "category",
            "basePrice", "imageUrl", "availableModifiers", "nutritionalInfo",
            "allergens", "isAvailable", "isActive", "preparationTime", "sortOrder"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            store.id,
            itemData.toastItemId || null,
            itemData.name,
            itemData.description,
            itemData.category,
            itemData.basePrice,
            itemData.imageUrl || null,
            JSON.stringify(itemData.availableModifiers || []),
            JSON.stringify(itemData.nutritionalInfo || {}),
            JSON.stringify(itemData.allergens || []),
            true, // isAvailable
            true, // isActive
            5, // preparationTime
            sortOrder,
          ]
        );
        totalSeeded++;
      }
    }

    console.log(
      `✅ Successfully seeded ${totalSeeded} menu items (${menuItemsData.length} unique items × ${stores.length} stores)!`,
    );
  } catch (error) {
    console.error('❌ Error seeding menu items:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

seedMenuItems();

