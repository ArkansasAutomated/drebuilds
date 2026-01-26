import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  targetEmail: string;
  isDeleting?: boolean;
}

export const DeleteConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  targetEmail,
  isDeleting = false,
}: DeleteConfirmDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-destructive/50 max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-mono text-foreground flex items-center gap-2">
            <span className="text-primary">&gt;</span> SYSTEM_PROMPT
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded-sm">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="font-mono text-sm text-destructive">
                  WARNING: This action cannot be undone.
                </p>
              </div>
              <p className="font-mono text-sm text-muted-foreground">
                <span className="text-primary">&gt;</span> confirm_delete(
                <span className="text-data">"{targetEmail}"</span>)?
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel 
            className="font-mono text-sm bg-surface-elevated border-border hover:bg-muted"
            disabled={isDeleting}
          >
            ABORT
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className="font-mono text-sm bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                DELETING...
              </>
            ) : (
              "CONFIRM_DELETE"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
