"use client"

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowLeft, Users, Gift, Settings, Play, Plus, X, Mail, Calendar, DollarSign } from "lucide-react"
import Link from "next/link"

interface Party {
  id: string
  name: string
  description: string
  createdBy: string
  createdByName: string
  participants: string[]
  status: "draft" | "active" | "completed"
  minValue?: number
  createdAt: string
  participantDetails: Array<{
    id: string
    name: string
    email: string
  }>
  assignments?: Array<{
    giver: string
    receiver: string
  }>
}

interface Participant {
  id: string
  name: string
  email: string
}

interface GiftSuggestion {
  id: string
  participantId: string
  title: string
  description?: string
  price?: number
  url?: string
  addedBy: string
  addedAt: string
}

export default function PartyManagementPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [party, setParty] = useState<Party | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Edit states
  const [editingBasicInfo, setEditingBasicInfo] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editMinValue, setEditMinValue] = useState("")

  // Invite states
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [newParticipantName, setNewParticipantName] = useState("")
  const [newParticipantEmail, setNewParticipantEmail] = useState("")

  // Launch confirmation
  const [showLaunchDialog, setShowLaunchDialog] = useState(false)

  // Gift suggestions state
  const [giftSuggestions, setGiftSuggestions] = useState<GiftSuggestion[]>([])
  const [showAddSuggestionDialog, setShowAddSuggestionDialog] = useState(false)
  const [selectedParticipantForSuggestion, setSelectedParticipantForSuggestion] = useState("")
  const [newSuggestionTitle, setNewSuggestionTitle] = useState("")
  const [newSuggestionDescription, setNewSuggestionDescription] = useState("")
  const [newSuggestionPrice, setNewSuggestionPrice] = useState("")
  const [newSuggestionUrl, setNewSuggestionUrl] = useState("")

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    loadParty()
    loadGiftSuggestions()
  }, [user, router, params.id])

  const loadParty = () => {
    const parties = JSON.parse(localStorage.getItem("secret-santa-parties") || "[]")
    const foundParty = parties.find((p: Party) => p.id === params.id)

    if (!foundParty) {
      setError("Party not found")
      setIsLoading(false)
      return
    }

    if (foundParty.createdBy !== user?.id) {
      setError("You don't have permission to manage this party")
      setIsLoading(false)
      return
    }

    setParty(foundParty)
    setEditName(foundParty.name)
    setEditDescription(foundParty.description)
    setEditMinValue(foundParty.minValue?.toString() || "")
    setIsLoading(false)
  }

  const loadGiftSuggestions = () => {
    const suggestions = JSON.parse(localStorage.getItem("secret-santa-gift-suggestions") || "[]")
    const partySuggestions = suggestions.filter((s: GiftSuggestion) => {
      const parties = JSON.parse(localStorage.getItem("secret-santa-parties") || "[]")
      const currentParty = parties.find((p: Party) => p.id === params.id)
      return currentParty?.participants.includes(s.participantId)
    })
    setGiftSuggestions(partySuggestions)
  }

  const updateParty = (updatedParty: Party) => {
    const parties = JSON.parse(localStorage.getItem("secret-santa-parties") || "[]")
    const updatedParties = parties.map((p: Party) => (p.id === updatedParty.id ? updatedParty : p))
    localStorage.setItem("secret-santa-parties", JSON.stringify(updatedParties))
    setParty(updatedParty)
  }

  const saveBasicInfo = () => {
    if (!party || !editName.trim() || !editDescription.trim()) {
      setError("Name and description are required")
      return
    }

    const updatedParty = {
      ...party,
      name: editName.trim(),
      description: editDescription.trim(),
      minValue: editMinValue ? Number(editMinValue) : undefined,
    }

    updateParty(updatedParty)
    setEditingBasicInfo(false)
    setSuccess("Party details updated successfully")
  }

  const addParticipant = () => {
    if (!party || !newParticipantName.trim() || !newParticipantEmail.trim()) {
      setError("Please enter both name and email")
      return
    }

    if (party.participantDetails.some((p) => p.email === newParticipantEmail.trim().toLowerCase())) {
      setError("A participant with this email already exists")
      return
    }

    const newParticipant = {
      id: Date.now().toString(),
      name: newParticipantName.trim(),
      email: newParticipantEmail.trim().toLowerCase(),
    }

    const updatedParty = {
      ...party,
      participants: [...party.participants, newParticipant.id],
      participantDetails: [...party.participantDetails, newParticipant],
    }

    updateParty(updatedParty)

    // Create invitation
    const invitation = {
      id: `${party.id}-${newParticipant.id}`,
      partyId: party.id,
      partyName: party.name,
      invitedBy: user!.id,
      invitedByName: user!.name,
      invitedUser: newParticipant.id,
      invitedUserEmail: newParticipant.email,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
    }

    const invitations = JSON.parse(localStorage.getItem("secret-santa-invitations") || "[]")
    invitations.push(invitation)
    localStorage.setItem("secret-santa-invitations", JSON.stringify(invitations))

    setNewParticipantName("")
    setNewParticipantEmail("")
    setShowInviteDialog(false)
    setSuccess("Participant added and invitation sent!")
  }

  const removeParticipant = (participantId: string) => {
    if (!party || participantId === user?.id) return

    const updatedParty = {
      ...party,
      participants: party.participants.filter((id) => id !== participantId),
      participantDetails: party.participantDetails.filter((p) => p.id !== participantId),
    }

    updateParty(updatedParty)
    setSuccess("Participant removed successfully")
  }

  const generateAssignments = (participants: string[]): Array<{ giver: string; receiver: string }> => {
    const shuffled = [...participants].sort(() => Math.random() - 0.5)
    const assignments = []

    for (let i = 0; i < shuffled.length; i++) {
      const giver = shuffled[i]
      const receiver = shuffled[(i + 1) % shuffled.length]
      assignments.push({ giver, receiver })
    }

    return assignments
  }

  const launchParty = () => {
    if (!party) return

    if (party.participants.length < 3) {
      setError("You need at least 3 participants to launch the party")
      return
    }

    const assignments = generateAssignments(party.participants)
    const updatedParty = {
      ...party,
      status: "active" as const,
      assignments,
      launchedAt: new Date().toISOString(),
    }

    updateParty(updatedParty)
    setShowLaunchDialog(false)
    setSuccess("Party launched successfully! All participants have been assigned their Secret Santa recipients.")
  }

  const addGiftSuggestion = () => {
    if (!newSuggestionTitle.trim() || !selectedParticipantForSuggestion) {
      setError("Please enter a gift title and select a participant")
      return
    }

    const newSuggestion: GiftSuggestion = {
      id: Date.now().toString(),
      participantId: selectedParticipantForSuggestion,
      title: newSuggestionTitle.trim(),
      description: newSuggestionDescription.trim() || undefined,
      price: newSuggestionPrice ? Number(newSuggestionPrice) : undefined,
      url: newSuggestionUrl.trim() || undefined,
      addedBy: user!.id,
      addedAt: new Date().toISOString(),
    }

    const allSuggestions = JSON.parse(localStorage.getItem("secret-santa-gift-suggestions") || "[]")
    allSuggestions.push(newSuggestion)
    localStorage.setItem("secret-santa-gift-suggestions", JSON.stringify(allSuggestions))

    setGiftSuggestions([...giftSuggestions, newSuggestion])
    setNewSuggestionTitle("")
    setNewSuggestionDescription("")
    setNewSuggestionPrice("")
    setNewSuggestionUrl("")
    setSelectedParticipantForSuggestion("")
    setShowAddSuggestionDialog(false)
    setSuccess("Gift suggestion added successfully!")
  }

  const removeGiftSuggestion = (suggestionId: string) => {
    const allSuggestions = JSON.parse(localStorage.getItem("secret-santa-gift-suggestions") || "[]")
    const updatedSuggestions = allSuggestions.filter((s: GiftSuggestion) => s.id !== suggestionId)
    localStorage.setItem("secret-santa-gift-suggestions", JSON.stringify(updatedSuggestions))

    setGiftSuggestions(giftSuggestions.filter((s) => s.id !== suggestionId))
    setSuccess("Gift suggestion removed successfully!")
  }

  const getMySecretSantaTarget = () => {
    if (!party?.assignments || !user) return null
    const myAssignment = party.assignments.find((a) => a.giver === user.id)
    if (!myAssignment) return null
    return party.participantDetails.find((p) => p.id === myAssignment.receiver)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p>Loading party...</p>
        </div>
      </div>
    )
  }

  if (error && !party) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!party) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button asChild variant="ghost" className="mr-4">
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-red-600">{party.name}</h1>
                <Badge
                  variant={
                    party.status === "active" ? "default" : party.status === "completed" ? "secondary" : "outline"
                  }
                  className="mt-1"
                >
                  {party.status}
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {party.status === "draft" && (
                <Button
                  onClick={() => setShowLaunchDialog(true)}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={party.participants.length < 3}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Launch Party
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 mb-6">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-3xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="gifts">Gift Ideas</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="assignments">{party.status === "active" ? "Assignments" : "Preview"}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="flex items-center p-6">
                  <Users className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold">{party.participants.length}</p>
                    <p className="text-sm text-gray-500">Participants</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center p-6">
                  <Gift className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold">{party.minValue ? `$${party.minValue}` : "No limit"}</p>
                    <p className="text-sm text-gray-500">Min Gift Value</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center p-6">
                  <Calendar className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold">{party.status === "active" ? "Active" : "Draft"}</p>
                    <p className="text-sm text-gray-500">Status</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center p-6">
                  <Mail className="h-8 w-8 text-red-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold">{party.participants.length - 1}</p>
                    <p className="text-sm text-gray-500">Invitations Sent</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Party Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{party.description}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="participants" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Manage Participants</h3>
              {party.status === "draft" && (
                <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-red-600 hover:bg-red-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Invite More
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite New Participant</DialogTitle>
                      <DialogDescription>Add a new person to your Secret Santa party</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="participantName">Name</Label>
                        <Input
                          id="participantName"
                          value={newParticipantName}
                          onChange={(e) => setNewParticipantName(e.target.value)}
                          placeholder="Enter participant name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="participantEmail">Email</Label>
                        <Input
                          id="participantEmail"
                          type="email"
                          value={newParticipantEmail}
                          onChange={(e) => setNewParticipantEmail(e.target.value)}
                          placeholder="Enter email address"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={addParticipant} className="bg-red-600 hover:bg-red-700">
                        Send Invitation
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="grid gap-4">
              {party.participantDetails.map((participant) => (
                <Card key={participant.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 font-medium">{participant.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-medium">{participant.name}</p>
                        <p className="text-sm text-gray-500">{participant.email}</p>
                      </div>
                      {participant.id === user?.id && (
                        <Badge variant="secondary" className="ml-2">
                          You
                        </Badge>
                      )}
                    </div>
                    {party.status === "draft" && participant.id !== user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeParticipant(participant.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="gifts" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Gift Suggestions</h3>
              <Dialog open={showAddSuggestionDialog} onOpenChange={setShowAddSuggestionDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Suggestion
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Gift Suggestion</DialogTitle>
                    <DialogDescription>Suggest a gift idea for one of the participants</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="participantSelect">For Participant</Label>
                      <select
                        id="participantSelect"
                        value={selectedParticipantForSuggestion}
                        onChange={(e) => setSelectedParticipantForSuggestion(e.target.value)}
                        className="w-full p-2 border border-input rounded-md bg-background"
                      >
                        <option value="">Select a participant</option>
                        {party?.participantDetails.map((participant) => (
                          <option key={participant.id} value={participant.id}>
                            {participant.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="suggestionTitle">Gift Idea</Label>
                      <Input
                        id="suggestionTitle"
                        value={newSuggestionTitle}
                        onChange={(e) => setNewSuggestionTitle(e.target.value)}
                        placeholder="e.g., Wireless headphones"
                      />
                    </div>
                    <div>
                      <Label htmlFor="suggestionDescription">Description (optional)</Label>
                      <Textarea
                        id="suggestionDescription"
                        value={newSuggestionDescription}
                        onChange={(e) => setNewSuggestionDescription(e.target.value)}
                        placeholder="Additional details about the gift..."
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="suggestionPrice">Estimated Price (optional)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="suggestionPrice"
                          type="number"
                          min="0"
                          step="0.01"
                          value={newSuggestionPrice}
                          onChange={(e) => setNewSuggestionPrice(e.target.value)}
                          placeholder="0.00"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="suggestionUrl">Link (optional)</Label>
                      <Input
                        id="suggestionUrl"
                        type="url"
                        value={newSuggestionUrl}
                        onChange={(e) => setNewSuggestionUrl(e.target.value)}
                        placeholder="https://example.com/product"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddSuggestionDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addGiftSuggestion} className="bg-red-600 hover:bg-red-700">
                      Add Suggestion
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* My Secret Santa Target */}
            {party?.status === "active" && getMySecretSantaTarget() && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-800 flex items-center">
                    <Gift className="h-5 w-5 mr-2" />
                    Your Secret Santa Target
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    You are buying a gift for: <strong>{getMySecretSantaTarget()?.name}</strong>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {giftSuggestions.filter((s) => s.participantId === getMySecretSantaTarget()?.id).length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm text-green-700 font-medium">
                        Gift suggestions for {getMySecretSantaTarget()?.name}:
                      </p>
                      {giftSuggestions
                        .filter((s) => s.participantId === getMySecretSantaTarget()?.id)
                        .map((suggestion) => (
                          <div key={suggestion.id} className="p-3 bg-white rounded-lg border">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium">{suggestion.title}</h4>
                                {suggestion.description && (
                                  <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                  {suggestion.price && (
                                    <span className="flex items-center">
                                      <DollarSign className="h-3 w-3 mr-1" />
                                      {suggestion.price}
                                    </span>
                                  )}
                                  {suggestion.url && (
                                    <a
                                      href={suggestion.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline"
                                    >
                                      View Link
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-green-700 text-sm">
                      No gift suggestions yet for {getMySecretSantaTarget()?.name}.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* All Gift Suggestions */}
            <div className="space-y-4">
              <h4 className="font-medium">All Gift Suggestions</h4>
              {party?.participantDetails.map((participant) => {
                const participantSuggestions = giftSuggestions.filter((s) => s.participantId === participant.id)

                return (
                  <Card key={participant.id}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>Gift Ideas for {participant.name}</span>
                        <Badge variant="outline">{participantSuggestions.length} suggestions</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {participantSuggestions.length > 0 ? (
                        <div className="space-y-3">
                          {participantSuggestions.map((suggestion) => {
                            const addedByUser = party.participantDetails.find((p) => p.id === suggestion.addedBy)
                            return (
                              <div key={suggestion.id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h5 className="font-medium">{suggestion.title}</h5>
                                    {suggestion.description && (
                                      <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                      <span>Suggested by {addedByUser?.name}</span>
                                      {suggestion.price && (
                                        <span className="flex items-center">
                                          <DollarSign className="h-3 w-3 mr-1" />
                                          {suggestion.price}
                                        </span>
                                      )}
                                      {suggestion.url && (
                                        <a
                                          href={suggestion.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline"
                                        >
                                          View Link
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                  {suggestion.addedBy === user?.id && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeGiftSuggestion(suggestion.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No gift suggestions yet for {participant.name}</p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Basic Information
                  {!editingBasicInfo && party.status === "draft" && (
                    <Button variant="outline" size="sm" onClick={() => setEditingBasicInfo(true)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingBasicInfo ? (
                  <>
                    <div>
                      <Label htmlFor="editName">Party Name</Label>
                      <Input
                        id="editName"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Party name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="editDescription">Description</Label>
                      <Textarea
                        id="editDescription"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Party description"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="editMinValue">Minimum Gift Value</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="editMinValue"
                          type="number"
                          min="0"
                          step="0.01"
                          value={editMinValue}
                          onChange={(e) => setEditMinValue(e.target.value)}
                          placeholder="0.00"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={saveBasicInfo} className="bg-red-600 hover:bg-red-700">
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={() => setEditingBasicInfo(false)}>
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Party Name</Label>
                      <p className="font-medium">{party.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Description</Label>
                      <p className="text-gray-700">{party.description}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Minimum Gift Value</Label>
                      <p className="font-medium">{party.minValue ? `$${party.minValue}` : "No minimum set"}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            {party.status === "active" && party.assignments ? (
              <Card>
                <CardHeader>
                  <CardTitle>Secret Santa Assignments</CardTitle>
                  <CardDescription>Here are the Secret Santa assignments for your party</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {party.assignments.map((assignment, index) => {
                      const giver = party.participantDetails.find((p) => p.id === assignment.giver)
                      const receiver = party.participantDetails.find((p) => p.id === assignment.receiver)
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{giver?.name}</span>
                          <span className="text-gray-500">→</span>
                          <span className="font-medium">{receiver?.name}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Party Not Launched Yet</h3>
                  <p className="text-gray-500 mb-4">
                    Launch your party to generate Secret Santa assignments for all participants.
                  </p>
                  {party.participants.length >= 3 ? (
                    <Button onClick={() => setShowLaunchDialog(true)} className="bg-green-600 hover:bg-green-700">
                      <Play className="h-4 w-4 mr-2" />
                      Launch Party Now
                    </Button>
                  ) : (
                    <p className="text-sm text-red-600">You need at least 3 participants to launch the party.</p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Launch Confirmation Dialog */}
      <Dialog open={showLaunchDialog} onOpenChange={setShowLaunchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Launch Secret Santa Party?</DialogTitle>
            <DialogDescription>
              This will generate Secret Santa assignments for all participants. Once launched, you cannot add or remove
              participants or modify the assignments.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLaunchDialog(false)}>
              Cancel
            </Button>
            <Button onClick={launchParty} className="bg-green-600 hover:bg-green-700">
              <Play className="h-4 w-4 mr-2" />
              Launch Party
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
