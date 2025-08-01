// Demo data for Facebook integration testing
// This provides mock data when no real Facebook app is configured

export const demoFacebookUser = {
  id: "demo_user_123",
  name: "Demo Business Owner",
  email: "demo@stella-business.com",
  picture: {
    data: {
      url: "https://via.placeholder.com/150/4267B2/white?text=FB"
    }
  }
};

export const demoFacebookPages = [
  {
    id: "demo_page_1",
    name: "Stella Demo Restaurant",
    picture: {
      data: {
        url: "https://via.placeholder.com/150/1877F2/white?text=RESTAURANT"
      }
    },
    access_token: "demo_page_token_1"
  },
  {
    id: "demo_page_2", 
    name: "Stella Demo Shop",
    picture: {
      data: {
        url: "https://via.placeholder.com/150/42A5F5/white?text=SHOP"
      }
    },
    access_token: "demo_page_token_2"
  }
];

export const demoInstagramAccounts = [
  {
    id: "demo_ig_1",
    name: "stella_restaurant_official",
    picture: "https://via.placeholder.com/150/E4405F/white?text=IG",
    pageId: "demo_page_1",
    pageName: "Stella Demo Restaurant"
  },
  {
    id: "demo_ig_2",
    name: "stella_shop_style", 
    picture: "https://via.placeholder.com/150/FF6B6B/white?text=IG",
    pageId: "demo_page_2",
    pageName: "Stella Demo Shop"
  }
];

export const demoInstagramMedia = [
  {
    id: "demo_reel_1",
    media_type: "VIDEO" as const,
    media_url: "https://via.placeholder.com/400x600/E4405F/white?text=REEL+1",
    thumbnail_url: "https://via.placeholder.com/400x600/E4405F/white?text=REEL+1",
    permalink: "https://instagram.com/demo_reel_1",
    caption: "🍕 Fresh pizza made with love! Check out our new wood-fired oven technique. Perfect for sharing with customers! #pizza #foodie #stellarestaurant",
    timestamp: new Date().toISOString(),
    like_count: 245,
    comments_count: 18
  },
  {
    id: "demo_reel_2", 
    media_type: "VIDEO" as const,
    media_url: "https://via.placeholder.com/400x600/FF6B6B/white?text=REEL+2",
    thumbnail_url: "https://via.placeholder.com/400x600/FF6B6B/white?text=REEL+2",
    permalink: "https://instagram.com/demo_reel_2",
    caption: "✨ Behind the scenes: Creating our signature pasta sauce. The secret ingredient? Love and fresh herbs from our garden! 🌿",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    like_count: 189,
    comments_count: 12
  },
  {
    id: "demo_reel_3",
    media_type: "VIDEO" as const, 
    media_url: "https://via.placeholder.com/400x600/4ECDC4/white?text=REEL+3",
    thumbnail_url: "https://via.placeholder.com/400x600/4ECDC4/white?text=REEL+3",
    permalink: "https://instagram.com/demo_reel_3",
    caption: "🛍️ New summer collection is here! Comfortable, stylish, and perfect for any occasion. Which color is your favorite?",
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    like_count: 312,
    comments_count: 27
  },
  {
    id: "demo_reel_4",
    media_type: "IMAGE" as const,
    media_url: "https://via.placeholder.com/400x400/FFD93D/black?text=PHOTO+1",
    thumbnail_url: "https://via.placeholder.com/400x400/FFD93D/black?text=PHOTO+1",
    permalink: "https://instagram.com/demo_photo_1",
    caption: "🌅 Good morning! Starting the day with fresh ingredients and positive energy. What's your morning ritual?",
    timestamp: new Date(Date.now() - 259200000).toISOString(),
    like_count: 156,
    comments_count: 8
  },
  {
    id: "demo_reel_5",
    media_type: "VIDEO" as const,
    media_url: "https://via.placeholder.com/400x600/9B59B6/white?text=REEL+4", 
    thumbnail_url: "https://via.placeholder.com/400x600/9B59B6/white?text=REEL+4",
    permalink: "https://instagram.com/demo_reel_5",
    caption: "💃 Fashion tip Tuesday! How to style our versatile jacket for three different occasions. Swipe to see all looks!",
    timestamp: new Date(Date.now() - 345600000).toISOString(),
    like_count: 203,
    comments_count: 15
  },
  {
    id: "demo_reel_6",
    media_type: "VIDEO" as const,
    media_url: "https://via.placeholder.com/400x600/F39C12/white?text=REEL+5",
    thumbnail_url: "https://via.placeholder.com/400x600/F39C12/white?text=REEL+5", 
    permalink: "https://instagram.com/demo_reel_6",
    caption: "🍰 Dessert magic in progress! Watch how we create our famous tiramisu. The perfect ending to any meal at Stella.",
    timestamp: new Date(Date.now() - 432000000).toISOString(),
    like_count: 278,
    comments_count: 22
  }
];

export const demoFacebookMedia = [
  {
    id: "demo_fb_post_1",
    type: "photo" as const,
    media_url: "https://via.placeholder.com/600x400/1877F2/white?text=FB+POST+1",
    thumbnail_url: "https://via.placeholder.com/600x400/1877F2/white?text=FB+POST+1",
    permalink_url: "https://facebook.com/demo_fb_post_1",
    caption: "🎉 Grand opening celebration! Thank you to everyone who joined us for this special day. Here's to many more years of serving our community!",
    timestamp: new Date().toISOString(),
    like_count: 67,
    comments_count: 14
  },
  {
    id: "demo_fb_post_2",
    type: "video" as const,
    media_url: "https://via.placeholder.com/600x400/42A5F5/white?text=FB+VIDEO+1", 
    thumbnail_url: "https://via.placeholder.com/600x400/42A5F5/white?text=FB+VIDEO+1",
    permalink_url: "https://facebook.com/demo_fb_post_2",
    caption: "📹 Take a virtual tour of our newly renovated dining space! Modern comfort meets traditional warmth. Book your table today!",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    like_count: 89,
    comments_count: 7
  },
  {
    id: "demo_fb_post_3",
    type: "photo" as const,
    media_url: "https://via.placeholder.com/600x400/E74C3C/white?text=FB+POST+2",
    thumbnail_url: "https://via.placeholder.com/600x400/E74C3C/white?text=FB+POST+2",
    permalink_url: "https://facebook.com/demo_fb_post_3", 
    caption: "🍝 Monday special: Homemade pasta with our signature marinara sauce. Made fresh daily with organic tomatoes and fresh basil!",
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    like_count: 123,
    comments_count: 19
  }
];

export const isDemoMode = () => {
  const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
  return !appId || appId === 'your_facebook_app_id_here' || appId === 'your_app_id';
};
