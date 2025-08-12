// Social Media Comment Service
// Manages integration between social media comments and chat conversations

interface AIConfig {
  enabled: boolean;
  model: string;
  autoReply: boolean;
  responseDelay: number;
  personalityPrompt: string;
}

interface CommentOptions {
  limit?: number;
  offset?: number;
  platform?: string;
}

interface ActivityOptions {
  limit?: number;
  offset?: number;
}

interface SocialComment {
  id: number;
  platform_type: string;
  comment_text: string;
  author_name: string;
  author_handle: string;
  author_id: string;
  author_avatar_url?: string;
  post_title: string;
  post_url: string;
  post_media_url?: string;
  status: string;
  sentiment?: string;
  priority?: number;
  tags?: any;
  created_at: string;
}

class SocialMediaService {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = '') {
    this.apiBaseUrl = apiBaseUrl;
  }

  // Get AI configuration
  async getAIConfig() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/social-commenter?action=ai-config`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get AI config');
      }
      
      return data.config;
    } catch (error) {
      console.error('Error getting AI config:', error);
      throw error;
    }
  }

  // Update AI configuration
  async updateAIConfig(config: AIConfig) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/social-commenter?action=update-ai-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update AI config');
      }
      
      return data;
    } catch (error) {
      console.error('Error updating AI config:', error);
      throw error;
    }
  }

  // Get pending comments from all platforms
  async getPendingComments(options: CommentOptions = {}) {
    try {
      const params = new URLSearchParams({
        action: 'comments',
        status: 'pending',
        limit: String(options.limit || 50),
        offset: String(options.offset || 0)
      });

      if (options.platform) {
        params.append('platform', options.platform);
      }

      const response = await fetch(`${this.apiBaseUrl}/api/social-commenter?${params}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get comments');
      }
      
      return data.comments;
    } catch (error) {
      console.error('Error getting pending comments:', error);
      throw error;
    }
  }

  // Get recent activity
  async getActivity(options: ActivityOptions = {}) {
    try {
      const params = new URLSearchParams({
        action: 'activity',
        limit: String(options.limit || 20),
        offset: String(options.offset || 0)
      });

      const response = await fetch(`${this.apiBaseUrl}/api/social-commenter?${params}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get activity');
      }
      
      return data.activities;
    } catch (error) {
      console.error('Error getting activity:', error);
      throw error;
    }
  }

  // Generate AI response for a comment
  async generateAIResponse(commentId: number, commentText: string, postContext: string = '') {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/social-commenter?action=ai-respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId,
          commentText,
          postContext
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate AI response');
      }
      
      return {
        response: data.response,
        confidence: data.confidence,
        suggestionId: data.suggestionId
      };
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    }
  }

  // Send reply to a social media comment
  async sendReply(commentId: number, replyText: string, platform: string) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/social-commenter?action=send-reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId,
          replyText,
          platform
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to send reply');
      }
      
      return data;
    } catch (error) {
      console.error('Error sending reply:', error);
      throw error;
    }
  }

  // Mark comment as handled
  async markCommentHandled(commentId: number) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/social-commenter?action=mark-handled`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commentId })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to mark comment as handled');
      }
      
      return data;
    } catch (error) {
      console.error('Error marking comment as handled:', error);
      throw error;
    }
  }

  // Get connected platforms
  async getPlatforms() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/social-commenter?action=platforms`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get platforms');
      }
      
      return data.platforms;
    } catch (error) {
      console.error('Error getting platforms:', error);
      throw error;
    }
  }

  // Convert social media comment to chat conversation format
  convertCommentToConversation(comment: SocialComment) {
    const platformIcons: Record<string, string> = {
      'facebook': '📘',
      'instagram': '📷',
      'tiktok': '🎵',
      'facebook-ads': '📊'
    };

    return {
      id: `social_${comment.id}`,
      type: 'social_comment',
      customerPhone: comment.author_handle || comment.author_id,
      customerName: comment.author_name,
      platformType: comment.platform_type,
      platformIcon: platformIcons[comment.platform_type] || '💬',
      lastMessage: comment.comment_text,
      lastMessageTime: new Date(comment.created_at),
      unreadCount: comment.status === 'pending' ? 1 : 0,
      isOnline: false,
      socialData: {
        commentId: comment.id,
        postTitle: comment.post_title,
        postUrl: comment.post_url,
        authorAvatar: comment.author_avatar_url,
        platform: comment.platform_type,
        status: comment.status,
        sentiment: comment.sentiment,
        priority: comment.priority,
        tags: comment.tags
      }
    };
  }

  // Convert comment to message format for chat display
  convertCommentToMessage(comment: SocialComment) {
    return {
      id: `social_msg_${comment.id}`,
      type: 'social_comment',
      direction: 'inbound',
      content: comment.comment_text,
      timestamp: new Date(comment.created_at),
      senderName: comment.author_name,
      senderHandle: comment.author_handle,
      platform: comment.platform_type,
      postContext: {
        title: comment.post_title,
        url: comment.post_url,
        mediaUrl: comment.post_media_url
      },
      status: comment.status,
      metadata: {
        commentId: comment.id,
        authorId: comment.author_id,
        sentiment: comment.sentiment,
        priority: comment.priority
      }
    };
  }

  // Get social media conversations for chat interface
  async getSocialConversations() {
    try {
      const comments = await this.getPendingComments({ limit: 100 });
      
      // Group comments by author and platform
      const conversationMap = new Map();
      
      comments.forEach((comment: SocialComment) => {
        const key = `${comment.platform_type}_${comment.author_id}`;
        
        if (!conversationMap.has(key)) {
          conversationMap.set(key, this.convertCommentToConversation(comment));
        } else {
          // Update with latest comment if newer
          const existing = conversationMap.get(key);
          if (new Date(comment.created_at) > new Date(existing.lastMessageTime)) {
            existing.lastMessage = comment.comment_text;
            existing.lastMessageTime = new Date(comment.created_at);
          }
          existing.unreadCount += comment.status === 'pending' ? 1 : 0;
        }
      });
      
      return Array.from(conversationMap.values())
        .sort((a, b) => b.lastMessageTime - a.lastMessageTime);
        
    } catch (error) {
      console.error('Error getting social conversations:', error);
      return [];
    }
  }

  // Get messages for a social conversation
  async getSocialMessages(authorId: string, platform: string) {
    try {
      // Get all comments from this author on this platform
      const comments = await this.getPendingComments({ 
        platform, 
        limit: 100 
      });
      
      const authorComments = comments.filter((c: SocialComment) => c.author_id === authorId);
      
      return authorComments.map((comment: SocialComment) => this.convertCommentToMessage(comment))
        .sort((a: any, b: any) => a.timestamp.getTime() - b.timestamp.getTime());
        
    } catch (error) {
      console.error('Error getting social messages:', error);
      return [];
    }
  }

  // Check if user has connected social platforms
  async getConnectedPlatforms() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/social-commenter?action=platforms`);
      const data = await response.json();
      
      if (!data.success) {
        return [];
      }
      
      return data.platforms.filter((p: any) => p.connected);
    } catch (error) {
      console.error('Error getting connected platforms:', error);
      return [];
    }
  }

  // Format social media post preview for chat
  formatPostPreview(socialData: any) {
    if (!socialData) return null;

    return {
      title: socialData.postTitle,
      url: socialData.postUrl,
      platform: socialData.platform,
      icon: socialData.platformIcon || '💬'
    };
  }

  // Get suggested replies for auto-complete
  async getSuggestedReplies(commentText: string, platform: string, context: any = {}) {
    try {
      // Generate AI suggestions
      const aiResponse = await this.generateAIResponse(
        context.commentId,
        commentText,
        context.postTitle
      );

      // Add some common quick replies
      const quickReplies = [
        "Thank you for your comment!",
        "We appreciate your feedback!",
        "Please check your DM for more details.",
        "Thank you for your interest in our products!",
        "We're glad you like it!"
      ];

      return {
        aiSuggestion: {
          text: aiResponse.response,
          confidence: aiResponse.confidence,
          type: 'ai_generated'
        },
        quickReplies: quickReplies.map(text => ({
          text,
          type: 'quick_reply'
        }))
      };

    } catch (error) {
      console.error('Error getting suggested replies:', error);
      return {
        aiSuggestion: null,
        quickReplies: []
      };
    }
  }

  // Bulk AI Response Generation
  async generateBulkAIResponses(options: { post_id?: string, platform?: string, exclude_replied?: boolean } = {}) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/social-commenter?action=bulk-ai-respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options)
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate bulk AI responses');
      }

      return {
        responses: data.responses,
        total: data.total_comments,
        message: data.message
      };

    } catch (error) {
      console.error('Error generating bulk AI responses:', error);
      throw error;
    }
  }

  // Send bulk replies
  async sendBulkReplies(replies: Array<{ comment_id: number, response_text: string, platform: string }>) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/social-commenter?action=bulk-send-replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ replies })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to send bulk replies');
      }

      return {
        results: data.results,
        summary: data.summary,
        message: data.message
      };

    } catch (error) {
      console.error('Error sending bulk replies:', error);
      throw error;
    }
  }

  // Get all comments for a specific post (for bulk operations)
  async getPostComments(postId: string, platform?: string) {
    try {
      const params = new URLSearchParams({
        action: 'post-comments',
        post_id: postId
      });

      if (platform) {
        params.append('platform', platform);
      }

      const response = await fetch(`${this.apiBaseUrl}/api/social-commenter?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get post comments');
      }

      return data.comments || [];

    } catch (error) {
      console.error('Error getting post comments:', error);
      throw error;
    }
  }
}

export default SocialMediaService;
