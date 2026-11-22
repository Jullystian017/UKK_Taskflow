"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  FlexRender,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type Row,
  type SortingState,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { useDashboard } from "@/context/dashboard-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { GripVerticalIcon, CircleCheckIcon, LoaderIcon, EllipsisVerticalIcon, Columns3Icon, ChevronDownIcon, PlusIcon, ChevronsLeftIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsRightIcon, CalendarIcon, FolderIcon, Pencil, Trash2, Clock } from "lucide-react"
import { TaskDialog } from "@/components/modals/task-dialog"
import { Todo, Priority, Status, Subtask } from "@/types"

// New in v9: declare the features this table uses — anything you don't
// register is tree-shaken out of the bundle.
const features = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
})

const columnHelper = createColumnHelper<
  typeof features,
  z.infer<typeof schema>
>()

export const schema = z.object({
  id: z.number(),
  todoId: z.string().optional(),
  header: z.string(),
  type: z.string(),
  status: z.string(),
  target: z.string(),
  limit: z.string(),
  reviewer: z.string(),
})

interface TableActionContextType {
  onEdit: (todoId: string) => void;
  onToggleStatus: (todoId: string) => void;
  onDelete: (todoId: string) => void;
}

const TableActionContext = React.createContext<TableActionContextType | null>(null);

function RowActionMenu({
  row,
}: {
  row: Row<typeof features, z.infer<typeof schema>>;
}) {
  const actions = React.useContext(TableActionContext);
  const todoId = row.original.todoId;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="flex size-8 text-muted-foreground data-open:bg-muted"
            size="icon"
          />
        }
      >
        <EllipsisVerticalIcon className="size-4" />
        <span className="sr-only">Buka menu aksi</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          className="cursor-pointer gap-2 text-xs"
          onClick={() => todoId && actions?.onEdit(todoId)}
        >
          <Pencil className="size-3.5" />
          <span>Detail & Edit</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-2 text-xs"
          onClick={() => todoId && actions?.onToggleStatus(todoId)}
        >
          <CircleCheckIcon className="size-3.5" />
          <span>
            {row.original.status === "Done"
              ? "Kembalikan Tugas"
              : "Tandai Selesai"}
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive"
          onClick={() => todoId && actions?.onDelete(todoId)}
        >
          <Trash2 className="size-3.5" />
          <span>Hapus Tugas</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Create a separate component for the drag handle
function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({
    id,
  })
  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground hover:bg-transparent"
    >
      <GripVerticalIcon className="size-3 text-muted-foreground" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}
const columns = columnHelper.columns([
  columnHelper.display({
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  }),
  columnHelper.display({
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={
            table.getIsSomePageRowsSelected() &&
            !table.getIsAllPageRowsSelected()
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  }),
  columnHelper.accessor("header", {
    header: "Judul Tugas",
    cell: ({ row }) => {
      return <TableCellViewer item={row.original} />
    },
    enableHiding: false,
  }),
  columnHelper.accessor("type", {
    header: "Proyek",
    cell: ({ row }) => (
      <div className="min-w-24">
        <Badge variant="outline" className="px-2 py-0.5 text-xs text-muted-foreground">
          {row.original.type}
        </Badge>
      </div>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const isDone = status === "Done";
      const isInProgress = status === "In Progress" || status === "In Process";
      return (
        <Badge
          variant="outline"
          className={`px-2 py-0.5 text-xs gap-1.5 font-medium whitespace-nowrap ${
            isDone
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : isInProgress
              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
              : "bg-muted text-muted-foreground border-border/60"
          }`}
        >
          {isDone ? (
            <CircleCheckIcon className="size-3.5 fill-current" />
          ) : isInProgress ? (
            <LoaderIcon className="size-3.5 animate-spin" />
          ) : (
            <Clock className="size-3.5" />
          )}
          <span>{status === "In Process" ? "In Progress" : status}</span>
        </Badge>
      );
    },
  }),
  columnHelper.accessor("target", {
    header: "Prioritas",
    cell: ({ row }) => {
      const priority = row.original.target.toLowerCase();
      const style =
        priority === "high" || priority === "tinggi"
          ? "bg-destructive/10 text-destructive border-destructive/20 font-medium"
          : priority === "medium" || priority === "sedang"
          ? "bg-muted text-foreground/80 border-border/60 font-medium"
          : "bg-muted/40 text-muted-foreground border-transparent";
      return (
        <Badge variant="outline" className={`px-2 py-0.5 text-xs capitalize whitespace-nowrap ${style}`}>
          {row.original.target}
        </Badge>
      );
    },
  }),
  columnHelper.accessor("limit", {
    header: "Batas Waktu",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
        <CalendarIcon className="size-3.5 shrink-0" />
        <span>{row.original.limit}</span>
      </div>
    ),
  }),
  columnHelper.accessor("reviewer", {
    header: "Workspace",
    cell: ({ row }) => (
      <span className="text-xs font-medium text-foreground/85 whitespace-nowrap">
        {row.original.reviewer}
      </span>
    ),
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => <RowActionMenu row={row} />,
  }),
])
function DraggableRow({
  row,
}: {
  row: Row<typeof features, z.infer<typeof schema>>
}) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })
  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          <FlexRender cell={cell} />
        </TableCell>
      ))}
    </TableRow>
  )
}
const COLUMN_DISPLAY_NAMES: Record<string, string> = {
  header: "Judul Tugas",
  type: "Proyek",
  status: "Status",
  target: "Prioritas",
  limit: "Batas Waktu",
  reviewer: "Workspace",
}

export function DataTable({
  data: initialData,
}: {
  data: z.infer<typeof schema>[]
}) {
  const { todos, projects, workspaces, handleSyncTodos, setIsQuickCreateOpen } = useDashboard()
  const [data, setData] = React.useState(initialData)
  const [prevInitialData, setPrevInitialData] = React.useState(initialData)
  const [activeTab, setActiveTab] = React.useState("all")

  // Modal Edit Task
  const [editingTodo, setEditingTodo] = React.useState<Todo | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)

  const handleActionEdit = React.useCallback(
    (todoId: string) => {
      const target = todos.find((t) => t.id === todoId)
      if (target) {
        setEditingTodo(target)
        setIsEditDialogOpen(true)
      } else {
        toast.error("Tugas tidak ditemukan")
      }
    },
    [todos]
  )

  const handleActionToggleStatus = React.useCallback(
    (todoId: string) => {
      const target = todos.find((t) => t.id === todoId)
      if (!target) return
      let nextStatus: Status = "todo"
      if (target.status === "todo") nextStatus = "in_progress"
      else if (target.status === "in_progress") nextStatus = "done"
      else nextStatus = "todo"

      const updated = todos.map((t) =>
        t.id === todoId ? { ...t, status: nextStatus } : t
      )
      handleSyncTodos(updated)
      toast.success(
        `Status tugas diubah ke "${
          nextStatus === "in_progress"
            ? "In Progress"
            : nextStatus === "done"
            ? "Selesai"
            : "To Do"
        }"`
      )
    },
    [todos, handleSyncTodos]
  )

  const handleActionDelete = React.useCallback(
    (todoId: string) => {
      const updated = todos.filter((t) => t.id !== todoId)
      handleSyncTodos(updated)
      toast.success("Tugas berhasil dihapus!")
    },
    [todos, handleSyncTodos]
  )

  const handleSaveEditedTodo = React.useCallback(
    (updatedData: {
      id?: string
      title: string
      description: string
      project_id: string
      priority: Priority
      status: Status
      due_date?: string | null
      subtasks: Subtask[]
    }) => {
      if (!updatedData.id) return
      const updated = todos.map((t) =>
        t.id === updatedData.id ? { ...t, ...updatedData } : t
      )
      handleSyncTodos(updated)
      toast.success("Tugas berhasil diperbarui!")
    },
    [todos, handleSyncTodos]
  )

  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData)
    setData(initialData)
  }

  const filteredData = React.useMemo(() => {
    if (activeTab === "in-progress") {
      return data.filter(
        (item) => item.status === "In Progress" || item.status === "In Process"
      )
    }
    if (activeTab === "todo") {
      return data.filter((item) => item.status === "To Do")
    }
    if (activeTab === "done") {
      return data.filter((item) => item.status === "Done")
    }
    return data
  }, [data, activeTab])

  const inProgressCount = data.filter(
    (item) => item.status === "In Progress" || item.status === "In Process"
  ).length
  const todoCount = data.filter((item) => item.status === "To Do").length
  const doneCount = data.filter((item) => item.status === "Done").length

  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )
  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => filteredData?.map(({ id }) => id) || [],
    [filteredData]
  )
  const table = useTable({
    features,
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
  })
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }
  return (
    <TableActionContext.Provider
      value={{
        onEdit: handleActionEdit,
        onToggleStatus: handleActionToggleStatus,
        onDelete: handleActionDelete,
      }}
    >
      <Tabs
        value={activeTab}
        onValueChange={(val) => val && setActiveTab(val)}
        className="w-full flex-col justify-start gap-6"
      >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select
          value={activeTab}
          onValueChange={(val) => val && setActiveTab(val)}
        >
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Pilih Tampilan">
              {(val: string | null) => {
                if (val === "all") return `Semua Tugas (${data.length})`;
                if (val === "in-progress") return `In Progress (${inProgressCount})`;
                if (val === "todo") return `To Do (${todoCount})`;
                if (val === "done") return `Selesai (${doneCount})`;
                return "Pilih Tampilan";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Semua Tugas ({data.length})</SelectItem>
              <SelectItem value="in-progress">
                In Progress ({inProgressCount})
              </SelectItem>
              <SelectItem value="todo">To Do ({todoCount})</SelectItem>
              <SelectItem value="done">Selesai ({doneCount})</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <TabsList className="hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="all">Semua Tugas ({data.length})</TabsTrigger>
          <TabsTrigger value="in-progress">
            In Progress <Badge variant="secondary">{inProgressCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="todo">
            To Do <Badge variant="secondary">{todoCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="done">
            Selesai <Badge variant="secondary">{doneCount}</Badge>
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="sm" />}
            >
              <Columns3Icon data-icon="inline-start" />
              Kolom
              <ChevronDownIcon data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  const label = COLUMN_DISPLAY_NAMES[column.id] || column.id;
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="cursor-pointer text-xs"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsQuickCreateOpen(true)}
          >
            <PlusIcon />
            <span className="hidden lg:inline">Tambah Tugas</span>
          </Button>
        </div>
      </div>
      <TabsContent
        value={activeTab}
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder ? null : (
                            <FlexRender header={header} />
                          )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.state.pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
                items={[10, 20, 30, 40, 50].map((pageSize) => ({
                  label: `${pageSize}`,
                  value: `${pageSize}`,
                }))}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue placeholder={table.state.pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectGroup>
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.state.pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeftIcon
                />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeftIcon
                />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRightIcon
                />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRightIcon
                />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>

    {/* Modal Edit Task */}
    {isEditDialogOpen && editingTodo && (
      <TaskDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        workspaces={workspaces}
        projects={projects}
        showWorkspaceSelect
        editingTodo={editingTodo}
        onSaveTodo={handleSaveEditedTodo}
      />
    )}
  </TableActionContext.Provider>
  )
}

function TableCellViewer({ item }: { item: z.infer<typeof schema> }) {
  const isMobile = useIsMobile()
  return (
    <Drawer swipeDirection={isMobile ? "down" : "right"}>
      <DrawerTrigger
        render={
          <Button
            variant="link"
            className="w-fit px-0 text-left text-foreground hover:underline"
          />
        }
      >
        {item.header}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1 border-b pb-4">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                item.status === "Done"
                  ? "bg-muted text-foreground border-border/80 font-medium"
                  : "bg-muted/50 text-muted-foreground border-border/50 font-normal"
              }
            >
              {item.status}
            </Badge>
            <Badge
              variant="outline"
              className={
                item.target === "High"
                  ? "border-destructive/20 bg-destructive/10 text-destructive font-medium"
                  : "bg-muted/50 text-muted-foreground border-border/50 font-normal"
              }
            >
              Prioritas {item.target}
            </Badge>
          </div>
          <DrawerTitle className="text-xl font-semibold mt-2">{item.header}</DrawerTitle>
          <DrawerDescription className="text-xs">
            Proyek: <span className="font-medium text-foreground">{item.type}</span> • Workspace: <span className="font-medium text-foreground">{item.reviewer}</span>
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 rounded-lg border p-3">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <FolderIcon className="size-3.5" /> Proyek
              </span>
              <span className="font-medium text-sm">{item.type}</span>
            </div>
            <div className="flex flex-col gap-1.5 rounded-lg border p-3">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <CalendarIcon className="size-3.5" /> Batas Waktu
              </span>
              <span className="font-medium text-sm">{item.limit}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="header">Judul Tugas</Label>
            <Input id="header" defaultValue={item.header} readOnly className="bg-muted/40" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="status">Status</Label>
              <Input id="status" defaultValue={item.status} readOnly className="bg-muted/40" />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="priority">Prioritas</Label>
              <Input id="priority" defaultValue={item.target} readOnly className="bg-muted/40" />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="workspace">Ruang Kerja (Workspace)</Label>
            <Input id="workspace" defaultValue={item.reviewer} readOnly className="bg-muted/40" />
          </div>
        </div>
        <DrawerFooter className="border-t pt-4">
          <DrawerClose render={<Button variant="outline" className="w-full" />}>Tutup</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
