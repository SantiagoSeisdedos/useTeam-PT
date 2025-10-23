import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useBoards } from "../contexts/BoardsContext";
import { useAccount } from "wagmi";
// Removed unused Card imports
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { User, Settings, Share2, LogOut, Copy, Check } from "lucide-react";
import { WalletConnect } from "./WalletConnect";
import { ExportButton } from "./ExportButton";
import { boardsApi, authApi } from "../services/api";
import { toast } from "sonner";
import { AudioSettings } from "./AudioSettings";
import { InvitationsPanel } from "./InvitationsPanel";

const UserProfile: React.FC = () => {
  const { logout, isAuthenticated } = useAuth();
  const { boards, refreshData } = useBoards();
  const { address } = useAccount();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isInvitationsOpen, setIsInvitationsOpen] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [targetWalletAddress, setTargetWalletAddress] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShareBoard = async () => {
    if (!selectedBoardId || !targetWalletAddress) {
      toast.error(
        "Por favor selecciona un tablero y ingresa una dirección de wallet"
      );
      return;
    }

    setIsSharing(true);
    try {
      // Buscar el usuario por wallet address
      const userData = await authApi.getUserByWallet(targetWalletAddress);

      // Compartir el tablero con el userId encontrado
      await boardsApi.shareBoard(selectedBoardId, userData.userId);
      toast.success("Tablero compartido exitosamente");
      setTargetWalletAddress("");
      setSelectedBoardId("");
      setIsInviteOpen(false);
      refreshData(); // Recargar datos después de compartir
    } catch (error) {
      console.error("Error sharing board:", error);
      toast.error(
        "Error al compartir el tablero. Verifica que la dirección de wallet sea correcta."
      );
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Error al copiar: " + error);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <WalletConnect />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Profile Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">
              {formatAddress(address || "")}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Perfil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsInviteOpen(true)}>
            <Share2 className="mr-2 h-4 w-4" />
            Invitar Colaborador
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsInvitationsOpen(true)}>
            <User className="mr-2 h-4 w-4" />
            Mis Invitaciones
          </DropdownMenuItem>
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Export Button */}
      <ExportButton boards={boards} />

      {/* Profile Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Perfil de Usuario</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Wallet Address */}
            <div className="space-y-2">
              <Label>Dirección de Wallet</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={address || ""}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(address || "")}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Audio Settings */}
            <div className="space-y-4">
              <Label className="text-base font-medium">
                <AudioSettings />
                Configuración de Audio
              </Label>
            </div>

            <Separator />

            {/* Export Section */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Exportar Datos</Label>
              <p className="text-sm text-muted-foreground">
                Exporta el backlog de tus tableros a CSV
              </p>
              <ExportButton boards={boards} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invitar Colaborador</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Board Selection */}
            <div className="space-y-2">
              <Label htmlFor="board-select">Seleccionar Tablero</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {selectedBoardId
                      ? boards.find((b) => b._id === selectedBoardId)?.name
                      : "Seleccionar tablero..."}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  {boards
                    .filter((board) => !board.isPublic) // Solo tableros privados
                    .map((board) => (
                      <DropdownMenuItem
                        key={board._id}
                        onClick={() => setSelectedBoardId(board._id)}
                      >
                        {board.name}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Wallet Address Input */}
            <div className="space-y-2">
              <Label htmlFor="wallet-address">
                Dirección de Wallet del Colaborador
              </Label>
              <Input
                id="wallet-address"
                placeholder="0x..."
                value={targetWalletAddress}
                onChange={(e) => setTargetWalletAddress(e.target.value)}
                className="font-mono"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleShareBoard}
                disabled={!selectedBoardId || !targetWalletAddress || isSharing}
                className="flex-1"
              >
                {isSharing ? "Compartiendo..." : "Invitar"}
              </Button>
              <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invitations Dialog */}
      <Dialog open={isInvitationsOpen} onOpenChange={setIsInvitationsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestionar Invitaciones</DialogTitle>
          </DialogHeader>
          <InvitationsPanel onClose={() => setIsInvitationsOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserProfile;
