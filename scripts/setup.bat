@echo off
echo 🚀 Starting Academy Server Setup...

REM Check if .env exists
if not exist .env (
    echo 📝 Creating .env file from .env.example...
    copy .env.example .env
    echo ✅ .env file created. Please update it with your configurations.
) else (
    echo ✅ .env file already exists.
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

REM Generate Prisma Client
echo 🔧 Generating Prisma Client...
call npm run prisma:generate

REM Run migrations
echo 🗄️  Running database migrations...
call npm run prisma:migrate

REM Seed database
echo 🌱 Seeding database with initial data...
call npm run prisma:seed

echo ✨ Setup complete! You can now run 'npm run dev' to start the server.
pause
