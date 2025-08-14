// Emoji Vector Image Mapping Service
// Maps unicode emojis to vector PNG files

export interface EmojiMapping {
  unicode: string;
  name: string;
  filename: string;
  category: 'reactions' | 'faces' | 'gestures' | 'objects' | 'other';
}

// Common reaction emojis with their vector equivalents
export const reactionEmojis: EmojiMapping[] = [
  // Primary reactions
  { unicode: '👍', name: 'thumbs up', filename: 'Thumbs up 64.png', category: 'reactions' },
  { unicode: '❤️', name: 'red heart', filename: 'Red heart 64.png', category: 'reactions' },
  { unicode: '😍', name: 'heart eyes', filename: 'Smiling face with heart-eyes 64.png', category: 'reactions' },
  { unicode: '👏', name: 'clapping hands', filename: 'Clapping hands 64.png', category: 'reactions' },
  { unicode: '🔥', name: 'fire', filename: 'Fire 64.png', category: 'reactions' },
  
  // Face emojis
  { unicode: '😀', name: 'grinning face', filename: 'Grinning face 64.png', category: 'faces' },
  { unicode: '😃', name: 'grinning face with big eyes', filename: 'Grinning face with big eyes 64.png', category: 'faces' },
  { unicode: '😄', name: 'grinning face with smiling eyes', filename: 'Grinning face with smiling eyes 64.png', category: 'faces' },
  { unicode: '😁', name: 'beaming face', filename: 'Beaming face with smiling eyes 64.png', category: 'faces' },
  { unicode: '😆', name: 'grinning squinting face', filename: 'Grinning squinting face 64.png', category: 'faces' },
  { unicode: '😅', name: 'grinning face with sweat', filename: 'Grinning face with sweat 64.png', category: 'faces' },
  { unicode: '🤣', name: 'rolling on floor laughing', filename: 'Rolling on the floor laughing 64.png', category: 'faces' },
  { unicode: '😂', name: 'face with tears of joy', filename: 'Face with tears of joy 64.png', category: 'faces' },
  { unicode: '🙂', name: 'slightly smiling face', filename: 'Slightly smiling face 64.png', category: 'faces' },
  { unicode: '🙃', name: 'upside-down face', filename: 'Upside-down face 64.png', category: 'faces' },
  { unicode: '🥰', name: 'smiling face with hearts', filename: 'Smiling face with hearts 64.png', category: 'faces' },
  { unicode: '😊', name: 'smiling face with smiling eyes', filename: 'Smiling face with smiling eyes 64.png', category: 'faces' },
  { unicode: '😇', name: 'smiling face with halo', filename: 'Smiling face with halo 64.png', category: 'faces' },
  
  // More expressions
  { unicode: '😉', name: 'winking face', filename: 'Winking face 64.png', category: 'faces' },
  { unicode: '😌', name: 'relieved face', filename: 'Relieved face 64.png', category: 'faces' },
  { unicode: '😘', name: 'face blowing a kiss', filename: 'Face blowing a kiss 64.png', category: 'faces' },
  { unicode: '🥳', name: 'partying face', filename: 'Partying face 64.png', category: 'faces' },
  { unicode: '🤩', name: 'star-struck', filename: 'Star-struck 64.png', category: 'faces' },
  { unicode: '🤗', name: 'smiling face with open hands', filename: 'Smiling face with open hands 64.png', category: 'faces' },
  { unicode: '🤔', name: 'thinking face', filename: 'Thinking face 64.png', category: 'faces' },
  { unicode: '🫡', name: 'saluting face', filename: 'Saluting face 64.png', category: 'faces' },
  { unicode: '🤐', name: 'zipper-mouth face', filename: 'Zipper-mouth face 64.png', category: 'faces' },
  { unicode: '🤨', name: 'face with raised eyebrow', filename: 'Face with raised eyebrow 64.png', category: 'faces' },
  { unicode: '😐', name: 'neutral face', filename: 'Neutral face 64.png', category: 'faces' },
  { unicode: '😑', name: 'expressionless face', filename: 'Expressionless face 64.png', category: 'faces' },
  { unicode: '😶', name: 'face without mouth', filename: 'Face without mouth 64.png', category: 'faces' },
  { unicode: '🫥', name: 'dotted line face', filename: 'Dotted line face 64.png', category: 'faces' },
  
  // Negative emotions
  { unicode: '😒', name: 'unamused face', filename: 'Unamused face 64.png', category: 'faces' },
  { unicode: '🙄', name: 'face with rolling eyes', filename: 'Face with rolling eyes 64.png', category: 'faces' },
  { unicode: '😬', name: 'grimacing face', filename: 'Grimacing face 64.png', category: 'faces' },
  { unicode: '😮‍💨', name: 'face exhaling', filename: 'Face exhaling 64.png', category: 'faces' },
  { unicode: '🤥', name: 'lying face', filename: 'Lying face 64.png', category: 'faces' },
  { unicode: '😪', name: 'sleepy face', filename: 'Sleepy face 64.png', category: 'faces' },
  { unicode: '😴', name: 'sleeping face', filename: 'Sleeping face 64.png', category: 'faces' },
  { unicode: '😵', name: 'face with crossed-out eyes', filename: 'Face with crossed-out eyes 64.png', category: 'faces' },
  { unicode: '🤯', name: 'exploding head', filename: 'Exploding head 64.png', category: 'faces' },
  { unicode: '🤠', name: 'cowboy hat face', filename: 'Cowboy hat face 64.png', category: 'faces' },
  { unicode: '🥸', name: 'disguised face', filename: 'Disguised face 64.png', category: 'faces' },
  { unicode: '😎', name: 'smiling face with sunglasses', filename: 'Smiling face with sunglasses 64.png', category: 'faces' },
  { unicode: '🤓', name: 'nerd face', filename: 'Nerd face 64.png', category: 'faces' },
  { unicode: '🧐', name: 'face with monocle', filename: 'Face with monocle 64.png', category: 'faces' },
  { unicode: '😕', name: 'confused face', filename: 'Confused face 64.png', category: 'faces' },
  { unicode: '🫤', name: 'face with diagonal mouth', filename: 'Face with diagonal mouth 64.png', category: 'faces' },
  { unicode: '😟', name: 'worried face', filename: 'Worried face 64.png', category: 'faces' },
  { unicode: '🙁', name: 'slightly frowning face', filename: 'Slightly frowning face 64.png', category: 'faces' },
  { unicode: '☹️', name: 'frowning face', filename: 'Frowning face 64.png', category: 'faces' },
  { unicode: '😮', name: 'face with open mouth', filename: 'Face with open mouth 64.png', category: 'faces' },
  { unicode: '😯', name: 'hushed face', filename: 'Hushed face 64.png', category: 'faces' },
  { unicode: '😲', name: 'astonished face', filename: 'Astonished face 64.png', category: 'faces' },
  { unicode: '😳', name: 'flushed face', filename: 'Flushed face 64.png', category: 'faces' },
  { unicode: '🥺', name: 'pleading face', filename: 'Pleading face 64.png', category: 'faces' },
  { unicode: '🥹', name: 'face holding back tears', filename: 'Face holding back tears 64.png', category: 'faces' },
  { unicode: '😦', name: 'frowning face with open mouth', filename: 'Frowning face with open mouth 64.png', category: 'faces' },
  { unicode: '😧', name: 'anguished face', filename: 'Anguished face 64.png', category: 'faces' },
  { unicode: '😨', name: 'fearful face', filename: 'Fearful face 64.png', category: 'faces' },
  { unicode: '😰', name: 'anxious face with sweat', filename: 'Anxious face with sweat 64.png', category: 'faces' },
  { unicode: '😥', name: 'sad but relieved face', filename: 'Sad but relieved face 64.png', category: 'faces' },
  { unicode: '😢', name: 'crying face', filename: 'Crying face 64.png', category: 'faces' },
  { unicode: '😭', name: 'loudly crying face', filename: 'Loudly crying face 64.png', category: 'faces' },
  { unicode: '😱', name: 'face screaming in fear', filename: 'Face screaming in fear 64.png', category: 'faces' },
  { unicode: '😖', name: 'confounded face', filename: 'Confounded face 64.png', category: 'faces' },
  { unicode: '😣', name: 'persevering face', filename: 'Persevering face 64.png', category: 'faces' },
  { unicode: '😞', name: 'disappointed face', filename: 'Disappointed face 64.png', category: 'faces' },
  { unicode: '😓', name: 'downcast face with sweat', filename: 'Downcast face with sweat 64.png', category: 'faces' },
  { unicode: '😩', name: 'weary face', filename: 'Weary face 64.png', category: 'faces' },
  { unicode: '😫', name: 'tired face', filename: 'Tired face 64.png', category: 'faces' },
  { unicode: '🥱', name: 'yawning face', filename: 'Yawning face 64.png', category: 'faces' },
  { unicode: '😤', name: 'face with steam from nose', filename: 'Face with steam from nose 64.png', category: 'faces' },
  { unicode: '😡', name: 'enraged face', filename: 'Enraged face 64.png', category: 'faces' },
  { unicode: '😠', name: 'angry face', filename: 'Angry face 64.png', category: 'faces' },
  { unicode: '🤬', name: 'face with symbols on mouth', filename: 'Face with symbols on mouth 64.png', category: 'faces' },
  { unicode: '😈', name: 'smiling face with horns', filename: 'Smiling face with horns 64.png', category: 'faces' },
  { unicode: '👿', name: 'angry face with horns', filename: 'Angry face with horns 64.png', category: 'faces' },
  { unicode: '🤡', name: 'clown face', filename: 'Clown face 64.png', category: 'faces' },
  { unicode: '🥶', name: 'cold face', filename: 'Cold face 64.png', category: 'faces' },
  { unicode: '🥵', name: 'hot face', filename: 'Hot face 64.png', category: 'faces' },
  
  // Gesture emojis
  { unicode: '👎', name: 'thumbs down', filename: 'Thumbs down 64.png', category: 'gestures' },
  { unicode: '👌', name: 'OK hand', filename: 'OK hand 64.png', category: 'gestures' },
  { unicode: '🤌', name: 'pinched fingers', filename: 'Pinched fingers 64.png', category: 'gestures' },
  { unicode: '🤏', name: 'pinching hand', filename: 'Pinching hand 64.png', category: 'gestures' },
  { unicode: '✌️', name: 'victory hand', filename: 'Victory hand 64.png', category: 'gestures' },
  { unicode: '🤞', name: 'crossed fingers', filename: 'Crossed fingers 64.png', category: 'gestures' },
  { unicode: '🫰', name: 'hand with index finger and thumb crossed', filename: 'Hand with index finger and thumb crossed 64.png', category: 'gestures' },
  { unicode: '🤟', name: 'love-you gesture', filename: 'Love-you gesture 64.png', category: 'gestures' },
  { unicode: '🤘', name: 'sign of the horns', filename: 'Sign of the horns 64.png', category: 'gestures' },
  { unicode: '🤙', name: 'call me hand', filename: 'Call me hand 64.png', category: 'gestures' },
  { unicode: '👈', name: 'backhand index pointing left', filename: 'Backhand index pointing left 64.png', category: 'gestures' },
  { unicode: '👉', name: 'backhand index pointing right', filename: 'Backhand index pointing right 64.png', category: 'gestures' },
  { unicode: '👆', name: 'backhand index pointing up', filename: 'Backhand index pointing up 64.png', category: 'gestures' },
  { unicode: '🖕', name: 'middle finger', filename: 'Middle finger 64.png', category: 'gestures' },
  { unicode: '👇', name: 'backhand index pointing down', filename: 'Backhand index pointing down 64.png', category: 'gestures' },
  { unicode: '☝️', name: 'index pointing up', filename: 'Index pointing up 64.png', category: 'gestures' },
  { unicode: '🫵', name: 'index pointing at the viewer', filename: 'Index pointing at the viewer 64.png', category: 'gestures' },
  { unicode: '👋', name: 'waving hand', filename: 'Waving hand 64.png', category: 'gestures' },
  { unicode: '🤚', name: 'raised back of hand', filename: 'Raised back of hand 64.png', category: 'gestures' },
  { unicode: '🖐️', name: 'hand with fingers splayed', filename: 'Hand with fingers splayed 64.png', category: 'gestures' },
  { unicode: '✋', name: 'raised hand', filename: 'Raised hand 64.png', category: 'gestures' },
  { unicode: '🖖', name: 'vulcan salute', filename: 'Vulcan salute 64.png', category: 'gestures' },
  { unicode: '🫱', name: 'rightwards hand', filename: 'Rightwards hand 64.png', category: 'gestures' },
  { unicode: '🫲', name: 'leftwards hand', filename: 'Leftwards hand 64.png', category: 'gestures' },
  { unicode: '🫳', name: 'palm down hand', filename: 'Palm down hand 64.png', category: 'gestures' },
  { unicode: '🫴', name: 'palm up hand', filename: 'Palm up hand 64.png', category: 'gestures' },
  { unicode: '👐', name: 'open hands', filename: 'Open hands 64.png', category: 'gestures' },
  { unicode: '🙌', name: 'raising hands', filename: 'Raising hands 64.png', category: 'gestures' },
  { unicode: '🤲', name: 'palms up together', filename: 'Palms up together 64.png', category: 'gestures' },
  { unicode: '🤝', name: 'handshake', filename: 'Handshake 64.png', category: 'gestures' },
  { unicode: '🙏', name: 'folded hands', filename: 'Folded hands 64.png', category: 'gestures' }
];

// Get emoji image URL for a given unicode character
export function getEmojiImageUrl(unicode: string): string | null {
  const emoji = reactionEmojis.find(e => e.unicode === unicode);
  if (!emoji) return null;
  
  return `/assets/emojis/vector-emojis/64px/No Outline/${emoji.filename}`;
}

// Get all emojis for a specific category
export function getEmojisByCategory(category: EmojiMapping['category']): EmojiMapping[] {
  return reactionEmojis.filter(e => e.category === category);
}

// Get reaction emojis specifically for comment reactions
export function getReactionEmojis(): EmojiMapping[] {
  return reactionEmojis.filter(e => e.category === 'reactions');
}

// Get all available emojis
export function getAllEmojis(): EmojiMapping[] {
  return reactionEmojis;
}

// Check if an emoji has a vector equivalent
export function hasVectorEmoji(unicode: string): boolean {
  return reactionEmojis.some(e => e.unicode === unicode);
}
