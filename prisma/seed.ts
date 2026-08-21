import { PrismaClient, Role, UserStatus, ProductStatus, CouponType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcryptjs";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL variable not set");
}

const pool = new Pool({ connectionString });

async function initPrisma() {
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

let prisma: PrismaClient;

async function main() {
  prisma = await initPrisma();
  console.log("🌱 Starting seed...");

  // 1. Create Admin User (Idempotent)
  const adminEmail = process.env.ADMIN_EMAIL || "admin@acaiaba.com";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  let adminUser;
  if (!existingAdmin) {
    const passwordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || "acaiaba_admin_2026", 10);
    adminUser = await prisma.user.create({
      data: {
        name: "Administrador ACAIABA",
        email: adminEmail,
        passwordHash,
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
    });
    console.log("👤 Admin user created.");
  } else {
    adminUser = existingAdmin;
    console.log("👤 Admin user already exists.");
  }

  // 2. Create Brands
  const brandsData = [
    { name: "ACAIABA", slug: "acaiaba", description: "Marca própria de estilo e presença." },
    { name: "Nike", slug: "nike", description: "Just do it." },
    { name: "Adidas", slug: "adidas", description: "Impossible is nothing." },
    { name: "Puma", slug: "puma", description: "Forever faster." },
    { name: "Olympikus", slug: "olympikus", description: "A marca esportiva do Brasil." },
  ];

  const brands: Record<string, any> = {};
  for (const b of brandsData) {
    brands[b.slug] = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: {},
      create: {
        name: b.name,
        slug: b.slug,
        description: b.description,
        active: true,
      },
    });
  }
  console.log("🏷️ Brands upserted.");

  // 3. Create Categories & Subcategories
  const categoriesData = [
    {
      name: "Calçados",
      slug: "calcados",
      subcategories: [
        { name: "Tênis", slug: "tenis" },
        { name: "Chinelos", slug: "chinelos" },
        { name: "Sandálias", slug: "sandalias" },
      ],
    },
    {
      name: "Fitness e Academia",
      slug: "fitness",
      subcategories: [
        { name: "Roupas", slug: "roupas-fitness" },
        { name: "Acessórios", slug: "acessorios-fitness" },
        { name: "Equipamentos", slug: "equipamentos-fitness" },
      ],
    },
    {
      name: "Moda",
      slug: "moda",
      subcategories: [
        { name: "Camisetas", slug: "camisetas" },
        { name: "Calças", slug: "calcas" },
        { name: "Casacos", slug: "casacos" },
      ],
    },
    {
      name: "Casa e Enxoval",
      slug: "casa-enxoval",
      subcategories: [
        { name: "Cama", slug: "cama" },
        { name: "Banho", slug: "banho" },
        { name: "Decoração", slug: "decoracao" },
      ],
    },
    {
      name: "Beleza e Cuidados",
      slug: "beleza-cuidados",
      subcategories: [
        { name: "Cabelo", slug: "cabelo" },
        { name: "Pele", slug: "pele" },
        { name: "Maquiagem", slug: "maquiagem" },
      ],
    },
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoriesData) {
    const parent = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
      },
    });
    categories[cat.slug] = parent;

    for (const sub of cat.subcategories) {
      categories[sub.slug] = await prisma.category.upsert({
        where: { slug: sub.slug },
        update: {},
        create: {
          name: sub.name,
          slug: sub.slug,
          parentId: parent.id,
        },
      });
    }
  }
  console.log("📂 Categories and subcategories upserted.");

  // 4. Create Tags
  const tagsData = [
    { name: "Oferta", slug: "oferta" },
    { name: "Lançamento", slug: "lancamento" },
    { name: "Fitness", slug: "fitness-tag" },
    { name: "Casual", slug: "casual" },
    { name: "Inverno", slug: "inverno" },
  ];

  const tags: Record<string, any> = {};
  for (const t of tagsData) {
    tags[t.slug] = await prisma.tag.upsert({
      where: { slug: t.slug },
      update: {},
      create: {
        name: t.name,
        slug: t.slug,
      },
    });
  }
  console.log("🎗️ Tags upserted.");

  // 5. Create Products, Variants and Inventory
  const productsData = [
    // Shoes
    {
      name: "Tênis ACAIABA Force 1",
      slug: "tenis-acaiaba-force-1",
      description: "O tênis perfeito para quem busca conforto, performance e um estilo que marca presença.",
      detailedDescription: "Desenvolvido com materiais de alta qualidade, o Tênis ACAIABA Force 1 conta com solado amortecedor premium e malha respirável que mantém seus pés confortáveis o dia inteiro.",
      baseSku: "CAL-TEN-FRC1",
      brandSlug: "acaiaba",
      categorySlug: "tenis",
      price: 299.90,
      promotionalPrice: 249.90,
      isFeatured: true,
      tagSlugs: ["oferta", "lancamento", "casual"],
      variants: [
        { size: "38", color: "Preto", sku: "CAL-TEN-FRC1-38-PR", stock: 15 },
        { size: "39", color: "Preto", sku: "CAL-TEN-FRC1-39-PR", stock: 20 },
        { size: "40", color: "Preto", sku: "CAL-TEN-FRC1-40-PR", stock: 25 },
        { size: "41", color: "Preto", sku: "CAL-TEN-FRC1-41-PR", stock: 10 },
        { size: "39", color: "Branco", sku: "CAL-TEN-FRC1-39-BR", stock: 8 },
        { size: "40", color: "Branco", sku: "CAL-TEN-FRC1-40-BR", stock: 12 },
      ],
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
    },
    {
      name: "Chinelo Acaiaba Confort",
      slug: "chinelo-acaiaba-confort",
      description: "Extrema leveza e maciez para os seus momentos de descanso.",
      baseSku: "CAL-CHI-CONF",
      brandSlug: "acaiaba",
      categorySlug: "chinelos",
      price: 89.90,
      promotionalPrice: null,
      isFeatured: false,
      tagSlugs: ["casual"],
      variants: [
        { size: "37/38", color: "Preto", sku: "CAL-CHI-CONF-38-PR", stock: 50 },
        { size: "39/40", color: "Preto", sku: "CAL-CHI-CONF-40-PR", stock: 60 },
        { size: "41/42", color: "Preto", sku: "CAL-CHI-CONF-42-PR", stock: 40 },
      ],
      imageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80",
    },
    // Fitness
    {
      name: "Legging Fitness Pro",
      slug: "legging-fitness-pro",
      description: "Compressão na medida certa e zero transparência para o seu treino.",
      baseSku: "FIT-LEG-PRO",
      brandSlug: "acaiaba",
      categorySlug: "roupas-fitness",
      price: 129.90,
      promotionalPrice: 99.90,
      isFeatured: true,
      tagSlugs: ["oferta", "fitness-tag"],
      variants: [
        { size: "P", color: "Preto", sku: "FIT-LEG-PRO-P-PR", stock: 30 },
        { size: "M", color: "Preto", sku: "FIT-LEG-PRO-M-PR", stock: 45 },
        { size: "G", color: "Preto", sku: "FIT-LEG-PRO-G-PR", stock: 25 },
      ],
      imageUrl: "https://images.unsplash.com/photo-1506152983158-b4a74a01c721?w=600&auto=format&fit=crop&q=80",
    },
    {
      name: "Top Academia Flex",
      slug: "top-academia-flex",
      description: "Alta sustentação e conforto térmico para treinos intensos.",
      baseSku: "FIT-TOP-FLX",
      brandSlug: "acaiaba",
      categorySlug: "roupas-fitness",
      price: 79.90,
      promotionalPrice: null,
      isFeatured: false,
      tagSlugs: ["fitness-tag"],
      variants: [
        { size: "P", color: "Azul", sku: "FIT-TOP-FLX-P-AZ", stock: 20 },
        { size: "M", color: "Azul", sku: "FIT-TOP-FLX-M-AZ", stock: 35 },
        { size: "G", color: "Azul", sku: "FIT-TOP-FLX-G-AZ", stock: 15 },
      ],
      imageUrl: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&auto=format&fit=crop&q=80",
    },
    // Fashion
    {
      name: "Camiseta Algodão Egípcio Premium",
      slug: "camiseta-algodao-egipcio",
      description: "Toque extremamente macio e durabilidade incomparável.",
      baseSku: "MOD-CAM-EGP",
      brandSlug: "acaiaba",
      categorySlug: "camisetas",
      price: 119.90,
      promotionalPrice: 89.90,
      isFeatured: true,
      tagSlugs: ["lancamento", "casual"],
      variants: [
        { size: "P", color: "Branco", sku: "MOD-CAM-EGP-P-BR", stock: 20 },
        { size: "M", color: "Branco", sku: "MOD-CAM-EGP-M-BR", stock: 40 },
        { size: "G", color: "Branco", sku: "MOD-CAM-EGP-G-BR", stock: 30 },
        { size: "GG", color: "Branco", sku: "MOD-CAM-EGP-GG-BR", stock: 10 },
      ],
      imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80",
    },
    // Home
    {
      name: "Jogo de Cama Algodão 300 Fios",
      slug: "jogo-de-cama-300-fios",
      description: "Transforme suas noites com o luxo do cetim de algodão 300 fios.",
      baseSku: "CAS-CAM-300F",
      brandSlug: "acaiaba",
      categorySlug: "cama",
      price: 389.90,
      promotionalPrice: 349.90,
      isFeatured: false,
      tagSlugs: ["oferta"],
      variants: [
        { size: "Casal", color: "Cinza", sku: "CAS-CAM-300F-CS-CZ", stock: 10 },
        { size: "Queen", color: "Cinza", sku: "CAS-CAM-300F-QN-CZ", stock: 15 },
        { size: "King", color: "Cinza", sku: "CAS-CAM-300F-KG-CZ", stock: 8 },
      ],
      imageUrl: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop&q=80",
    },
    // Beauty
    {
      name: "Sérum Hidratante Ácido Hialurônico",
      slug: "serum-acido-hialuronico",
      description: "Hidratação profunda e redução de linhas de expressão.",
      baseSku: "BEL-SER-HIA",
      brandSlug: "acaiaba",
      categorySlug: "pele",
      price: 149.90,
      promotionalPrice: null,
      isFeatured: true,
      tagSlugs: ["lancamento"],
      variants: [
        { size: "50ml", color: "Padrão", sku: "BEL-SER-HIA-50ML", stock: 100 },
      ],
      imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
    },
  ];

  for (const prod of productsData) {
    const brand = brands[prod.brandSlug];
    const category = categories[prod.categorySlug];

    if (!brand || !category) continue;

    // Upsert Product
    const dbProduct = await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {
        price: prod.price,
        promotionalPrice: prod.promotionalPrice,
        isFeatured: prod.isFeatured,
      },
      create: {
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        detailedDescription: prod.detailedDescription,
        baseSku: prod.baseSku,
        brandId: brand.id,
        categoryId: category.id,
        price: prod.price,
        promotionalPrice: prod.promotionalPrice,
        isFeatured: prod.isFeatured,
        isActive: true,
        status: ProductStatus.ACTIVE,
        images: {
          create: [
            {
              url: prod.imageUrl,
              alt: prod.name,
              isFeatured: true,
              order: 1,
            },
          ],
        },
        tags: {
          connect: prod.tagSlugs.map(s => ({ id: tags[s].id })),
        },
      },
    });

    // Create Variants & Inventories
    for (const v of prod.variants) {
      const dbVariant = await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: {},
        create: {
          productId: dbProduct.id,
          sku: v.sku,
          size: v.size,
          color: v.color,
        },
      });

      // Upsert Inventory
      const dbInventory = await prisma.inventory.upsert({
        where: { variantId: dbVariant.id },
        update: {
          quantity: v.stock,
        },
        create: {
          variantId: dbVariant.id,
          quantity: v.stock,
          reserved: 0,
          minStock: 5,
        },
      });

      // Create an inventory movement as IN for initial stock setup (only if no movements exist for it)
      const existingMovements = await prisma.inventoryMovement.findMany({
        where: { inventoryId: dbInventory.id },
      });

      if (existingMovements.length === 0) {
        await prisma.inventoryMovement.create({
          data: {
            inventoryId: dbInventory.id,
            userId: adminUser.id,
            type: "IN",
            quantity: v.stock,
            reason: "Carga inicial de estoque via seed",
          },
        });
      }
    }
  }
  console.log("📦 Products, variants and inventory upserted.");

  // 6. Create Coupons
  const couponsData = [
    {
      code: "ACAIABA10",
      type: CouponType.PERCENTAGE,
      value: 10,
      minSubtotal: 50.0,
      active: true,
    },
    {
      code: "BEMVINDO50",
      type: CouponType.FIXED_AMOUNT,
      value: 50,
      minSubtotal: 200.0,
      active: true,
    },
  ];

  for (const c of couponsData) {
    const validFrom = new Date();
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 2); // Valid for 2 years

    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: {
        code: c.code,
        type: c.type,
        value: c.value,
        validFrom,
        validUntil,
        minSubtotal: c.minSubtotal,
        maxUses: 1000,
        maxUsesPerUser: 1,
        active: c.active,
      },
    });
  }
  console.log("🎫 Coupons upserted.");

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
    await pool.end();
  });
