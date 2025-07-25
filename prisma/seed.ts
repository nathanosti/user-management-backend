import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed do banco de dados...');

  if (process.env.NODE_ENV !== 'production') {
    console.log('Limpando dados existentes...');
    await prisma.user.deleteMany({});
  }

  const baseUsers = [
    {
      email: 'admin@sistema.com',
      name: 'Administrador Sistema',
      phone: '+5511999999999',
      birthDate: new Date('1985-06-15'),
      avatar: 'https://i.pravatar.cc/150?img=1',
      role: Role.ADMIN,
    },
    {
      email: 'joao.silva@email.com',
      name: 'João Silva',
      phone: '+5511888888888',
      birthDate: new Date('1990-03-20'),
      avatar: 'https://i.pravatar.cc/150?img=2',
      role: Role.MEMBER,
    },
    {
      email: 'maria.santos@email.com',
      name: 'Maria Santos',
      phone: '+5511777777777',
      birthDate: new Date('1988-11-10'),
      avatar: 'https://i.pravatar.cc/150?img=3',
      role: Role.MEMBER,
    },
    {
      email: 'pedro.oliveira@email.com',
      name: 'Pedro Oliveira',
      phone: '+5511666666666',
      birthDate: new Date('1992-07-05'),
      avatar: 'https://i.pravatar.cc/150?img=4',
      role: Role.MEMBER,
    },
    {
      email: 'ana.costa@email.com',
      name: 'Ana Costa',
      phone: '+5511555555555',
      birthDate: new Date('1995-12-25'),
      avatar: 'https://i.pravatar.cc/150?img=5',
      role: Role.MEMBER,
    },
  ];

  const extraUsers = Array.from({ length: 20 }).map((_, i) => {
    const index = i + 6;
    return {
      email: `user${index}@email.com`,
      name: `Usuário ${index}`,
      phone: `+5511${Math.floor(100000000 + Math.random() * 899999999)}`,
      birthDate: new Date(
        `1990-01-${String((index % 28) + 1).padStart(2, '0')}`,
      ),
      avatar: `https://i.pravatar.cc/150?img=${index}`,
      role: Role.MEMBER,
    };
  });

  const allUsers = [...baseUsers, ...extraUsers];

  console.log('Criando usuários...');

  for (const userData of allUsers) {
    const hashedPassword = await bcrypt.hash('senha123*', 10);

    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        password: hashedPassword,
        isActive: true,
      },
    });

    console.log(`✅ Usuário criado: ${user.name} (${user.email})`);
  }

  const totalUsers = await prisma.user.count();
  console.log(`📌 Total de usuários no banco: ${totalUsers}`);
  console.log('✅ Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
