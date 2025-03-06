"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PosResult, PosPaging } from "@/types";
import { formatDate } from "@/utils/date-formatter";

interface PosTableProps {
  results: PosResult[];
  paging: PosPaging;
  onSelectPos: (pos: PosResult) => void;
}

export function PosTable({ results, paging, onSelectPos }: PosTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Resultados</CardTitle>
          <CardDescription>
            Total: {paging.total} | Mostrando: {results.length}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>External ID</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((pos) => (
                <TableRow key={pos.id}>
                  <TableCell>{pos.id}</TableCell>
                  <TableCell>{pos.name}</TableCell>
                  <TableCell>{pos.external_id}</TableCell>
                  <TableCell>{formatDate(pos.date_created)}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectPos(pos)}
                    >
                      Ver detalles
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
