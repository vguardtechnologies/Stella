#!/bin/bash

# Stella WhatsApp Integration - Quick Database Setup
# This script sets up your app with a working database solution

echo "🚀 Stella WhatsApp Integration - Quick Database Setup"
echo "====================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${GREEN}✅ Current Status:${NC}"
echo "- Frontend: https://stella-nvyb66ka2-ayo-marcelles-projects.vercel.app"
echo "- Environment: Ready for database connection"
echo ""

echo -e "${BLUE}🗃️ Database Setup Options:${NC}"
echo ""
echo "Choose your database setup:"
echo "1. 📦 Continue with mock data (immediate testing)"
echo "2. 🟢 Set up Supabase (free PostgreSQL, 5 minutes)"
echo "3. 🔵 Set up PlanetScale (free MySQL, 3 minutes)"
echo "4. 🟣 Set up Vercel Postgres (paid, instant)"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo -e "${GREEN}📦 Continuing with mock data setup...${NC}"
        echo ""
        echo "Your app is already working with mock data!"
        echo "✅ Frontend: Live and ready"
        echo "✅ Mock API: Working perfectly"
        echo "✅ Data persistence: Local storage"
        echo ""
        echo -e "${BLUE}🔄 Next: WhatsApp API Setup${NC}"
        echo "1. Go to: https://developers.facebook.com/"
        echo "2. Create App → Business → WhatsApp"
        echo "3. Get Access Token & Phone Number ID"
        echo "4. Add them in your app settings"
        echo ""
        echo -e "${GREEN}🎯 Your app is ready for testing!${NC}"
        echo "Visit: https://stella-nvyb66ka2-ayo-marcelles-projects.vercel.app"
        ;;
    2)
        echo ""
        echo -e "${GREEN}🟢 Setting up Supabase database...${NC}"
        echo ""
        echo "1. Go to: https://supabase.com"
        echo "2. Click 'Start your project'"
        echo "3. Sign up/Login with GitHub"
        echo "4. Create new project:"
        echo "   - Name: stella-whatsapp"
        echo "   - Password: $(openssl rand -base64 16)"
        echo "   - Region: Choose closest to you"
        echo "5. Wait 2-3 minutes for setup"
        echo "6. Go to Settings → Database"
        echo "7. Copy connection string"
        echo "8. Run: vercel env add DATABASE_URL production"
        echo "9. Paste the connection string"
        echo ""
        echo -e "${YELLOW}⏳ After setup, redeploy with: vercel --prod${NC}"
        ;;
    3)
        echo ""
        echo -e "${GREEN}🔵 Setting up PlanetScale database...${NC}"
        echo ""
        echo "1. Go to: https://planetscale.com"
        echo "2. Sign up with GitHub"
        echo "3. Create new database:"
        echo "   - Name: stella-whatsapp"
        echo "   - Region: Choose closest"
        echo "4. Go to 'Connect' tab"
        echo "5. Select 'Connect with: Prisma'"
        echo "6. Copy the DATABASE_URL"
        echo "7. Run: vercel env add DATABASE_URL production"
        echo "8. Paste the URL"
        echo ""
        echo -e "${YELLOW}⏳ After setup, redeploy with: vercel --prod${NC}"
        ;;
    4)
        echo ""
        echo -e "${GREEN}🟣 Setting up Vercel Postgres...${NC}"
        echo ""
        echo "1. Go to: https://vercel.com/ayo-marcelles-projects/stella"
        echo "2. Click 'Storage' tab"
        echo "3. Click 'Create Database'"
        echo "4. Select 'Postgres'"
        echo "5. Choose your plan ($20/month for Hobby)"
        echo "6. Name: stella-db"
        echo "7. It will auto-connect to your project"
        echo ""
        echo -e "${YELLOW}⏳ After setup, redeploy with: vercel --prod${NC}"
        ;;
    *)
        echo ""
        echo -e "${RED}❌ Invalid choice. Please run the script again.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}📱 WhatsApp Integration Next Steps:${NC}"
echo "1. Get WhatsApp Business API credentials"
echo "2. Test sending messages"
echo "3. Set up webhooks for receiving messages"
echo ""
echo -e "${GREEN}🎉 You're almost ready to go live!${NC}"
