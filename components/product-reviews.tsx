"use client"

import { useState } from "react"
import Image from "next/image"
import { Star, ThumbsUp, MessageSquare, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

// Mock review data
const reviews = [
  {
    id: 1,
    author: "Emily S.",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 5,
    date: "2 weeks ago",
    title: "Absolutely love this dress!",
    content:
      "This dress exceeded my expectations! The fabric is high quality and the fit is perfect. I'm 5'6\" and usually wear a size M, and the medium fits me perfectly. The color is exactly as shown in the photos. I've received so many compliments!",
    helpful: 24,
    images: [
      "/placeholder.svg?height=100&width=100&text=Review+Image+1",
      "/placeholder.svg?height=100&width=100&text=Review+Image+2",
    ],
    verified: true,
  },
  {
    id: 2,
    author: "Sarah T.",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 4,
    date: "1 month ago",
    title: "Beautiful dress, slightly large",
    content:
      "The quality and design of this dress are beautiful. The only reason I'm giving 4 stars instead of 5 is because it runs slightly large. I'm usually a size S and had to get it taken in a bit. Otherwise, it's perfect for summer events!",
    helpful: 12,
    images: [],
    verified: true,
  },
  {
    id: 3,
    author: "Michelle K.",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 5,
    date: "2 months ago",
    title: "Perfect for my vacation",
    content:
      "I bought this for my beach vacation and it was perfect! Lightweight, comfortable, and so stylish. The fabric doesn't wrinkle easily which was great for packing. Will definitely be purchasing more from this brand.",
    helpful: 8,
    images: ["/placeholder.svg?height=100&width=100&text=Review+Image+1"],
    verified: true,
  },
]

export default function ProductReviews() {
  const [expandedReviews, setExpandedReviews] = useState<number[]>([])
  const [showAllReviews, setShowAllReviews] = useState(false)

  const toggleReviewExpand = (id: number) => {
    setExpandedReviews((prev) => (prev.includes(id) ? prev.filter((reviewId) => reviewId !== id) : [...prev, id]))
  }

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 2)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Customer Reviews</h3>
        <Button variant="outline" className="text-rose-500 border-rose-500">
          Write a Review
        </Button>
      </div>

      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="text-center">
          <div className="text-3xl font-bold">{4.7}</div>
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-4 w-4 ${i < 5 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
            ))}
          </div>
          <div className="text-sm text-muted-foreground mt-1">{reviews.length} reviews</div>
        </div>

        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = reviews.filter((r) => r.rating === rating).length
            const percentage = (count / reviews.length) * 100

            return (
              <div key={rating} className="flex items-center gap-2 text-sm">
                <div className="w-12 flex items-center">
                  {rating} <Star className="h-3 w-3 ml-1 fill-yellow-400 text-yellow-400" />
                </div>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }} />
                </div>
                <div className="w-8 text-right text-muted-foreground">{percentage.toFixed(0)}%</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="space-y-6">
        {displayedReviews.map((review) => {
          const isExpanded = expandedReviews.includes(review.id)
          const showToggle = review.content.length > 200

          return (
            <div key={review.id} className="border-b pb-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={review.avatar || "/placeholder.svg"} alt={review.author} />
                    <AvatarFallback>{review.author.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {review.author}
                      {review.verified && (
                        <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                          Verified Purchase
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{review.date}</div>
                  </div>
                </div>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                    />
                  ))}
                </div>
              </div>

              <h4 className="font-medium mt-3">{review.title}</h4>
              <p className="mt-2 text-muted-foreground">
                {isExpanded || !showToggle ? review.content : `${review.content.substring(0, 200)}...`}
              </p>

              {showToggle && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 h-auto p-0 text-rose-500"
                  onClick={() => toggleReviewExpand(review.id)}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" /> Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" /> Read more
                    </>
                  )}
                </Button>
              )}

              {review.images.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {review.images.map((img, i) => (
                    <div key={i} className="relative h-20 w-20 rounded-md overflow-hidden border">
                      <Image
                        src={img || "/placeholder.svg"}
                        alt={`Review image ${i + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 mt-3">
                <Button variant="ghost" size="sm" className="h-8 text-muted-foreground">
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Helpful ({review.helpful})
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-muted-foreground">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Reply
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {reviews.length > 2 && (
        <Button variant="outline" className="w-full" onClick={() => setShowAllReviews(!showAllReviews)}>
          {showAllReviews ? "Show Less Reviews" : `Show All Reviews (${reviews.length})`}
        </Button>
      )}
    </div>
  )
}
