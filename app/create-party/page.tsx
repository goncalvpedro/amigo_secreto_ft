"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, X, Users, Gift, Calendar } from "lucide-react"
import Link from "next/link"

interface Participant {
  id: string
  name: string
  email: string
}

export default function CreatePartyPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form state
  const [partyName, setPartyName] = useState("")
  const [description, setDescription] = useState("")
  const [minValue, setMinValue] = useState("")
  const [participants, setParticipants] = useState<Participant[]>([])
  const [newParticipantName, setNewParticipantName] = useState("")
  const [newParticipantEmail, setNewParticipantEmail] = useState("")

  useEffect(() => {
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

  const addParticipant = () => {
    if (!newParticipantName.trim() || !newParticipantEmail.trim()) {
      setError("Please enter both name and email for the participant")
      return
    }

    if (participants.some((p) => p.email === newParticipantEmail)) {
      setError("A participant with this email already exists")
      return
    }

    const newParticipant: Participant = {
      id: Date.now().toString(),
      name: newParticipantName.trim(),
      email: newParticipantEmail.trim().toLowerCase(),
    }

    setParticipants([...participants, newParticipant])
    setNewParticipantName("")
    setNewParticipantEmail("")
    setError("")
  }

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter((p) => p.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!partyName.trim()) {
      setError("Party name is required")
      return
    }

    if (!description.trim()) {
      setError("Party description is required")
      return
    }

    if (participants.length < 2) {
      setError("You need at least 2 participants for a Secret Santa party")
      return
    }

    if (minValue && (isNaN(Number(minValue)) || Number(minValue) < 0)) {
      setError("Minimum gift value must be a valid positive number")
      return
    }

    setIsLoading(true)

    try {
      // Create new party
      const newParty = {
        id: Date.now().toString(),
        name: partyName.trim(),
        description: description.trim(),
        createdBy: user!.id,
        createdByName: user!.name,
        participants: [user!.id, ...participants.map((p) => p.id)],
        status: "draft" as const,
        minValue: minValue ? Number(minValue) : undefined,
        createdAt: new Date().toISOString(),
        participantDetails: [{ id: user!.id, name: user!.name, email: user!.email }, ...participants],
      }

      // Save party to localStorage
      const existingParties = JSON.parse(localStorage.getItem("secret-santa-parties") || "[]")
      existingParties.push(newParty)
      localStorage.setItem("secret-santa-parties", JSON.stringify(existingParties))

      // Create invitations for participants
      const invitations = participants.map((participant) => ({
        id: `${newParty.id}-${participant.id}`,
        partyId: newParty.id,
        partyName: newParty.name,
        invitedBy: user!.id,
        invitedByName: user!.name,
        invitedUser: participant.id,
        invitedUserEmail: participant.email,
        status: "pending" as const,
        createdAt: new Date().toISOString(),
      }))

      const existingInvitations = JSON.parse(localStorage.getItem("secret-santa-invitations") || "[]")
      existingInvitations.push(...invitations)
      localStorage.setItem("secret-santa-invitations", JSON.stringify(existingInvitations))

      setSuccess("Party created successfully! Invitations have been sent to all participants.")

      // Redirect to party management page after a short delay
      setTimeout(() => {
        router.push(`/party/${newParty.id}`)
      }, 2000)
    } catch (err) {
      setError("Failed to create party. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button asChild variant="ghost" className="mr-4">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-red-600">🎅 Create New Party</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Form */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gift className="h-5 w-5 mr-2 text-red-600" />
                  Party Details
                </CardTitle>
                <CardDescription>Set up your Secret Santa party with all the important details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="border-green-200 bg-green-50">
                      <AlertDescription className="text-green-800">{success}</AlertDescription>
                    </Alert>
                  )}

                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="partyName">Party Name *</Label>
                      <Input
                        id="partyName"
                        value={partyName}
                        onChange={(e) => setPartyName(e.target.value)}
                        placeholder="e.g., Office Christmas 2024"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Tell participants about your Secret Santa party..."
                        rows={3}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="minValue">Minimum Gift Value (optional)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <Input
                          id="minValue"
                          type="number"
                          min="0"
                          step="0.01"
                          value={minValue}
                          onChange={(e) => setMinValue(e.target.value)}
                          placeholder="0.00"
                          className="pl-8"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Participants */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">Participants</Label>
                      <p className="text-sm text-gray-500 mb-4">Add people to your Secret Santa party</p>

                      {/* Add Participant Form */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        <Input
                          value={newParticipantName}
                          onChange={(e) => setNewParticipantName(e.target.value)}
                          placeholder="Participant name"
                        />
                        <div className="flex gap-2">
                          <Input
                            type="email"
                            value={newParticipantEmail}
                            onChange={(e) => setNewParticipantEmail(e.target.value)}
                            placeholder="email@example.com"
                            className="flex-1"
                          />
                          <Button type="button" onClick={addParticipant} size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Participants List */}
                      <div className="space-y-2">
                        {/* Current User */}
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border">
                          <div>
                            <span className="font-medium">{user.name}</span>
                            <span className="text-sm text-gray-500 ml-2">{user.email}</span>
                            <Badge variant="secondary" className="ml-2">
                              You
                            </Badge>
                          </div>
                        </div>

                        {/* Added Participants */}
                        {participants.map((participant) => (
                          <div
                            key={participant.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                          >
                            <div>
                              <span className="font-medium">{participant.name}</span>
                              <span className="text-sm text-gray-500 ml-2">{participant.email}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeParticipant(participant.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      {participants.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No participants added yet. Add at least 2 participants to create the party.
                        </p>
                      )}
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isLoading}>
                    {isLoading ? "Creating Party..." : "Create Party"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Calendar className="h-5 w-5 mr-2 text-red-600" />
                  Party Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Party Name</Label>
                  <p className="font-medium">{partyName || "Not set"}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Participants</Label>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span className="font-medium">{participants.length + 1} people</span>
                  </div>
                </div>

                {minValue && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Min Gift Value</Label>
                    <div className="flex items-center">
                      <Gift className="h-4 w-4 mr-1" />
                      <span className="font-medium">${minValue}</span>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge variant="outline">Draft</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="text-sm space-y-2">
                  <li className="flex items-start">
                    <span className="bg-red-100 text-red-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-2 mt-0.5">
                      1
                    </span>
                    Create your party with participants
                  </li>
                  <li className="flex items-start">
                    <span className="bg-gray-100 text-gray-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-2 mt-0.5">
                      2
                    </span>
                    Manage party settings and add gift suggestions
                  </li>
                  <li className="flex items-start">
                    <span className="bg-gray-100 text-gray-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-2 mt-0.5">
                      3
                    </span>
                    Launch the party when ready
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
