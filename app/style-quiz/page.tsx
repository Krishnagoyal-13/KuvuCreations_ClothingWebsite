"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronRight, ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"

const questions = [
  {
    id: "occasion",
    question: "What occasions are you shopping for?",
    type: "checkbox",
    options: [
      { id: "casual", label: "Casual everyday", image: "/placeholder.svg?height=150&width=150&text=Casual" },
      { id: "work", label: "Work/Office", image: "/placeholder.svg?height=150&width=150&text=Work" },
      {
        id: "evening",
        label: "Evening/Special occasions",
        image: "/placeholder.svg?height=150&width=150&text=Evening",
      },
      { id: "vacation", label: "Vacation", image: "/placeholder.svg?height=150&width=150&text=Vacation" },
    ],
  },
  {
    id: "style",
    question: "Which style resonates with you the most?",
    type: "radio",
    options: [
      { id: "minimal", label: "Minimal & Classic", image: "/placeholder.svg?height=200&width=150&text=Minimal" },
      {
        id: "bohemian",
        label: "Bohemian & Free-spirited",
        image: "/placeholder.svg?height=200&width=150&text=Bohemian",
      },
      { id: "trendy", label: "Trendy & Fashion-forward", image: "/placeholder.svg?height=200&width=150&text=Trendy" },
      { id: "romantic", label: "Romantic & Feminine", image: "/placeholder.svg?height=200&width=150&text=Romantic" },
    ],
  },
  {
    id: "colors",
    question: "What colors do you prefer to wear?",
    type: "checkbox",
    options: [
      {
        id: "neutrals",
        label: "Neutrals (Black, White, Beige)",
        image: "/placeholder.svg?height=150&width=150&text=Neutrals",
      },
      { id: "pastels", label: "Pastels", image: "/placeholder.svg?height=150&width=150&text=Pastels" },
      { id: "bold", label: "Bold & Bright", image: "/placeholder.svg?height=150&width=150&text=Bold" },
      { id: "earth", label: "Earth tones", image: "/placeholder.svg?height=150&width=150&text=Earth" },
    ],
  },
  {
    id: "fit",
    question: "What fits do you prefer?",
    type: "checkbox",
    options: [
      { id: "fitted", label: "Fitted/Tailored", image: "/placeholder.svg?height=200&width=150&text=Fitted" },
      { id: "relaxed", label: "Relaxed/Oversized", image: "/placeholder.svg?height=200&width=150&text=Relaxed" },
      { id: "structured", label: "Structured", image: "/placeholder.svg?height=200&width=150&text=Structured" },
      { id: "flowy", label: "Flowy/Draped", image: "/placeholder.svg?height=200&width=150&text=Flowy" },
    ],
  },
]

export default function StyleQuiz() {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [completed, setCompleted] = useState(false)

  const currentQuestion = questions[currentStep]
  const progress = ((currentStep + 1) / questions.length) * 100

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      setCompleted(true)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleRadioChange = (value: string) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: value,
    })
  }

  const handleCheckboxChange = (value: string) => {
    const currentValues = (answers[currentQuestion.id] as string[]) || []

    if (currentValues.includes(value)) {
      setAnswers({
        ...answers,
        [currentQuestion.id]: currentValues.filter((v) => v !== value),
      })
    } else {
      setAnswers({
        ...answers,
        [currentQuestion.id]: [...currentValues, value],
      })
    }
  }

  const isOptionSelected = (id: string) => {
    const answer = answers[currentQuestion.id]

    if (Array.isArray(answer)) {
      return answer.includes(id)
    }

    return answer === id
  }

  const canProceed = () => {
    const answer = answers[currentQuestion.id]
    return Array.isArray(answer) ? answer.length > 0 : !!answer
  }

  if (completed) {
    return (
      <div className="container max-w-4xl py-16 px-4">
        <div className="text-center space-y-6">
          <div className="inline-block p-4 bg-rose-100 rounded-full text-rose-500 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold">Your Style Profile is Ready!</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Based on your preferences, we've curated a collection of items that match your unique style.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mt-8">
            {["Bohemian", "Flowy", "Earth tones", "Vacation"].map((tag, i) => (
              <div key={i} className="bg-rose-50 text-rose-500 px-4 py-2 rounded-full text-sm font-medium">
                {tag}
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-4">
            <Button size="lg" className="bg-rose-500 hover:bg-rose-600" asChild>
              <Link href="/products/recommended">View Your Recommendations</Link>
            </Button>
            <div>
              <Button
                variant="link"
                className="text-muted-foreground"
                onClick={() => {
                  setCurrentStep(0)
                  setCompleted(false)
                }}
              >
                Retake Quiz
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-16 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">Find Your Personal Style</h1>
        <p className="text-center text-muted-foreground">
          Answer a few questions to discover clothing that matches your unique style
        </p>
      </div>

      <div className="mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span>
            Question {currentStep + 1} of {questions.length}
          </span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2 bg-muted" />
      </div>

      <div className="space-y-6">
        <h2 className="text-2xll font-bold">{currentQuestion.question}</h2>

        {currentQuestion.type === "radio" ? (
          <RadioGroup value={(answers[currentQuestion.id] as string) || ""} onValueChange={handleRadioChange}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option) => (
                <label
                  key={option.id}
                  htmlFor={option.id}
                  className={`relative flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all ${
                    isOptionSelected(option.id) ? "border-rose-500 bg-rose-50" : "border-muted hover:border-rose-200"
                  }`}
                >
                  <div className="relative h-40 w-full mb-4 rounded-md overflow-hidden">
                    <Image src={option.image || "/placeholder.svg"} alt={option.label} fill className="object-cover" />
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value={option.id} id={option.id} className="text-rose-500" />
                    <span className="font-medium">{option.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </RadioGroup>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion.options.map((option) => {
              const isSelected = isOptionSelected(option.id)

              return (
                <label
                  key={option.id}
                  htmlFor={option.id}
                  className={`relative flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected ? "border-rose-500 bg-rose-50" : "border-muted hover:border-rose-200"
                  }`}
                >
                  <div className="relative h-40 w-full mb-4 rounded-md overflow-hidden">
                    <Image src={option.image || "/placeholder.svg"} alt={option.label} fill className="object-cover" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={option.id}
                      checked={isSelected}
                      onCheckedChange={() => handleCheckboxChange(option.id)}
                      className="text-rose-500 border-muted"
                    />
                    <span className="font-medium">{option.label}</span>
                  </div>
                </label>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        <Button onClick={handleNext} disabled={!canProceed()} className="bg-rose-500 hover:bg-rose-600">
          {currentStep < questions.length - 1 ? "Next" : "See Results"} <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
