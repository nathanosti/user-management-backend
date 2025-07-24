import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed do banco de dados...');

  if (process.env.NODE_ENV !== 'production') {
    console.log('Limpando dados existentes...');
    await prisma.user.deleteMany({});
  }

  const users = [
    {
      email: 'admin@sistema.com',
      name: 'Administrador Sistema',
      phone: '+5511999999999',
      birthDate: new Date('1985-06-15'),
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
    {
      email: 'joao.silva@email.com',
      name: 'João Silva',
      phone: '+5511888888888',
      birthDate: new Date('1990-03-20'),
      avatar: 'https://i.pravatar.cc/150?img=2',
    },
    {
      email: 'maria.santos@email.com',
      name: 'Maria Santos',
      phone: '+5511777777777',
      birthDate: new Date('1988-11-10'),
      avatar: 'https://i.pravatar.cc/150?img=3',
    },
    {
      email: 'pedro.oliveira@email.com',
      name: 'Pedro Oliveira',
      phone: '+5511666666666',
      birthDate: new Date('1992-07-05'),
      avatar: 'https://i.pravatar.cc/150?img=4',
    },
    {
      email: 'ana.costa@email.com',
      name: 'Ana Costa',
      phone: '+5511555555555',
      birthDate: new Date('1995-12-25'),
      avatar: 'https://i.pravatar.cc/150?img=5',
    },
  ];

  console.log('Criando usuários...');

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });
    console.log(`Usuário criado: ${user.name} (${user.email})`);
  }

  const totalUsers = await prisma.user.count();
  console.log(`Total de usuários no banco: ${totalUsers}`);
  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
