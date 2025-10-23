import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Bell,
  Check,
  X,
  Users,
  Eye,
  Clock,
  UserPlus,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useBoards } from "../contexts/BoardsContext";
import { socketService } from "../services/socket";
import { invitationsApi } from "../services/api";
import { toast } from "sonner";
import type { User } from "../types";
import { Badge } from "./ui/badge";

interface InvitationsPanelProps {
  onClose?: () => void;
}

interface BoardInvitation {
  _id: string;
  boardId: {
    _id: string;
    name: string;
    isPublic: boolean;
    owner: User;
  };
  invitedBy: {
    _id: string;
    walletAddress: string;
    username?: string;
  };
  invitedUser: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  expiresAt?: string;
  respondedAt?: string;
}

export const InvitationsPanel: React.FC<InvitationsPanelProps> = ({
  onClose,
}) => {
  const { user } = useAuth();
  const { refreshData } = useBoards();
  const [invitations, setInvitations] = useState<BoardInvitation[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar invitaciones reales del backend
  useEffect(() => {
    const loadInvitations = async () => {
      if (!user) return;

      try {
        const pendingInvitations = await invitationsApi.getPendingInvitations();
        setInvitations(pendingInvitations);
      } catch (error) {
        console.error("Error loading invitations:", error);
        toast.error("Error al cargar las invitaciones");
      }
    };

    loadInvitations();
  }, [user]);

  // Configurar listeners de WebSocket para notificaciones en tiempo real
  useEffect(() => {
    // Listener para nuevas invitaciones
    socketService.onBoardInvited((data) => {
      toast.info("Nueva invitación recibida", {
        description: `Has sido invitado al tablero "${data.boardName}"`,
        duration: 5000,
      });

      // Recargar datos para mostrar la nueva invitación
      refreshData();
    });

    // Listener para invitaciones aceptadas
    socketService.onBoardInvitationAccepted((data) => {
      toast.success("Invitación aceptada", {
        description: `Tu invitación al tablero "${data.boardName}" fue aceptada`,
        duration: 3000,
      });
    });

    // Listener para invitaciones rechazadas
    socketService.onBoardInvitationDeclined((data) => {
      toast.info("Invitación rechazada", {
        description: `Tu invitación al tablero "${data.boardName}" fue rechazada`,
        duration: 3000,
      });
    });

    // Cleanup
    return () => {
      // Los listeners se limpian automáticamente en socketService
    };
  }, [refreshData]);

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      setLoading(true);
      await invitationsApi.acceptInvitation(invitationId);

      // Remover la invitación de la lista
      setInvitations((prev) => prev.filter((inv) => inv._id !== invitationId));

      toast.success("Invitación aceptada");
      refreshData(); // Recargar tableros
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast.error("Error al aceptar la invitación");
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      setLoading(true);
      await invitationsApi.rejectInvitation(invitationId);

      // Remover la invitación de la lista
      setInvitations((prev) => prev.filter((inv) => inv._id !== invitationId));

      toast.success("Invitación rechazada");
    } catch (error) {
      console.error("Error declining invitation:", error);
      toast.error("Error al rechazar la invitación");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pendiente
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="default" className="gap-1">
            <Check className="h-3 w-3" />
            Aceptada
          </Badge>
        );
      case "declined":
        return (
          <Badge variant="destructive" className="gap-1">
            <X className="h-3 w-3" />
            Rechazada
          </Badge>
        );
      default:
        return null;
    }
  };

  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "pending"
  );
  const acceptedInvitations = invitations.filter(
    (inv) => inv.status === "accepted"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Invitaciones</h3>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-orange-500" />
            <h4 className="font-medium">Invitaciones Pendientes</h4>
            <Badge variant="secondary">{pendingInvitations.length}</Badge>
          </div>

          {pendingInvitations.map((invitation) => (
            <Card
              key={invitation._id}
              className="border-orange-200 bg-orange-50/50"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      {invitation.boardId.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Invitado por:{" "}
                      <span className="font-mono">
                        {invitation.invitedBy.walletAddress}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(invitation.createdAt)}
                    </p>
                  </div>
                  {getStatusBadge(invitation.status)}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Users className="h-3 w-3" />
                    Tablero colaborativo
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Eye className="h-3 w-3" />
                    {invitation.boardId.isPublic ? "Público" : "Privado"}
                  </Badge>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    onClick={() => handleAcceptInvitation(invitation._id)}
                    disabled={loading}
                    className="flex-1 gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Aceptar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeclineInvitation(invitation._id)}
                    disabled={loading}
                    className="flex-1 gap-2"
                  >
                    <X className="h-4 w-4" />
                    Rechazar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Accepted Invitations */}
      {acceptedInvitations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-green-500" />
            <h4 className="font-medium">Tableros Compartidos</h4>
            <Badge variant="secondary">{acceptedInvitations.length}</Badge>
          </div>

          {acceptedInvitations.map((invitation) => (
            <Card
              key={invitation._id}
              className="border-green-200 bg-green-50/50"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      {invitation.boardId.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Propietario:{" "}
                      <span className="font-mono">
                        {invitation.invitedBy.walletAddress}
                      </span>
                    </p>
                  </div>
                  {getStatusBadge(invitation.status)}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Users className="h-3 w-3" />
                    Tablero colaborativo
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Eye className="h-3 w-3" />
                    {invitation.boardId.isPublic ? "Público" : "Privado"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Invitations */}
      {invitations.length === 0 && (
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h4 className="font-medium mb-2">No hay invitaciones</h4>
          <p className="text-sm text-muted-foreground">
            No tienes invitaciones pendientes ni tableros compartidos.
          </p>
        </div>
      )}
    </div>
  );
};
