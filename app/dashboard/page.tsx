"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Users, Gift, Calendar, LogOut } from "lucide-react"

interface Party {
  id: string
  name: string
  description: string
  createdBy: string
  createdByName: string
  participants: string[]
  participantDetails: { id: string; name: string; email: string }[]
  status: "draft" | "active" | "completed"
  minValue?: number
  launchDate?: string
}

interface Invitation {
  id: string
  partyId: string
  partyName: string
  invitedBy: string
  invitedByName: string
  status: "pending" | "accepted" | "declined"
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [parties, setParties] = useState<Party[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    // Load user's parties and invitations from localStorage
    const allParties = JSON.parse(localStorage.getItem("secret-santa-parties") || "[]")
    const userParties = allParties.filter((party: Party) => party.createdBy === user.id)
    setParties(userParties)

    const allInvitations = JSON.parse(localStorage.getItem("secret-santa-invitations") || "[]")
    const userInvitations = allInvitations.filter((inv: Invitation) => inv.invitedBy !== user.id)
    setInvitations(userInvitations)
  }, [user, router])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const acceptInvitation = (invitationId: string) => {
    const allInvitations = JSON.parse(localStorage.getItem("secret-santa-invitations") || "[]")
    const updatedInvitations = allInvitations.map((inv: Invitation) =>
      inv.id === invitationId ? { ...inv, status: "accepted" } : inv,
    )
    localStorage.setItem("secret-santa-invitations", JSON.stringify(updatedInvitations))

    const invitation = allInvitations.find((inv: Invitation) => inv.id === invitationId)
    if (invitation) {
      const allParties = JSON.parse(localStorage.getItem("secret-santa-parties") || "[]")
      const updatedParties = allParties.map((party: Party) => {
        if (party.id === invitation.partyId) {
          return {
            ...party,
            participants: [...party.participants, user!.id],
            participantDetails: [...party.participantDetails, { id: user!.id, name: user!.name, email: user!.email }],
          }
        }
        return party
      })
      localStorage.setItem("secret-santa-parties", JSON.stringify(updatedParties))
    }

    setInvitations(updatedInvitations.filter((inv: Invitation) => inv.invitedBy !== user?.id))
  }

  const declineInvitation = (invitationId: string) => {
    const allInvitations = JSON.parse(localStorage.getItem("secret-santa-invitations") || "[]")
    const updatedInvitations = allInvitations.map((inv: Invitation) =>
      inv.id === invitationId ? { ...inv, status: "declined" } : inv,
    )
    localStorage.setItem("secret-santa-invitations", JSON.stringify(updatedInvitations))
    setInvitations(updatedInvitations.filter((inv: Invitation) => inv.invitedBy !== user?.id))
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-red-600">🎅 Secret Santa</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarFallback className="bg-red-100 text-red-600">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{user.name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user.name}!</h2>
          <p className="text-gray-600">Manage your Secret Santa parties and invitations</p>
        </div>

        <Tabs defaultValue="parties" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="parties">My Parties</TabsTrigger>
            <TabsTrigger value="invitations">
              Invitations
              {invitations.filter((inv) => inv.status === "pending").length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                  {invitations.filter((inv) => inv.status === "pending").length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="parties" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Your Parties</h3>
              <Button asChild className="bg-red-600 hover:bg-red-700">
                <Link href="/create-party">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Party
                </Link>
              </Button>
            </div>

            {parties.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Gift className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No parties yet</h3>
                  <p className="text-gray-500 text-center mb-4">Create your first Secret Santa party to get started!</p>
                  <Button asChild className="bg-red-600 hover:bg-red-700">
                    <Link href="/create-party">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Party
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {parties.map((party) => (
                  <Card key={party.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{party.name}</CardTitle>
                        <Badge
                          variant={
                            party.status === "active"
                              ? "default"
                              : party.status === "completed"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {party.status}
                        </Badge>
                      </div>
                      <CardDescription>{party.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {party.participants.length} participants
                        </div>
                        {party.minValue && (
                          <div className="flex items-center">
                            <Gift className="h-4 w-4 mr-1" />${party.minValue} min
                          </div>
                        )}
                      </div>
                      <Button asChild variant="outline" className="w-full bg-transparent">
                        <Link href={`/party/${party.id}`}>Manage Party</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="invitations" className="space-y-6">
            <h3 className="text-xl font-semibold">Party Invitations</h3>

            {invitations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No invitations</h3>
                  <p className="text-gray-500 text-center">You don't have any party invitations at the moment.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <Card key={invitation.id}>
                    <CardContent className="flex items-center justify-between p-6">
                      <div>
                        <h4 className="font-medium">{invitation.partyName}</h4>
                        <p className="text-sm text-gray-500">Invited by {invitation.invitedByName}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            invitation.status === "accepted"
                              ? "default"
                              : invitation.status === "declined"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {invitation.status}
                        </Badge>
                        {invitation.status === "pending" && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => acceptInvitation(invitation.id)}
                            >
                              Accept
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => declineInvitation(invitation.id)}>
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
