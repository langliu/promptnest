import { createFileRoute } from '@tanstack/react-router'
import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { format } from 'date-fns'
import { FolderTree, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { z } from 'zod'

import { AdminPageHeader, AdminPageShell } from '@/components/admin/admin-page-shell'
import {
  FILTER_ACTIONS_CLASS,
  FILTER_FIELD_CLASS,
  FILTER_FORM_GRID_CLASS,
  FILTER_LABEL_CLASS,
} from '@/components/filter-form-layout'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  createCategoryFn,
  deleteCategoryFn,
  listCategoriesAdminFn,
  updateCategoryFn,
  type CategoryItem,
} from '@/lib/categories.functions'

const searchSchema = z.object({
  keyword: z.string().optional(),
})

type CategoryFormState = {
  name: string
  description: string
  sort_order: string
}

const emptyForm: CategoryFormState = {
  name: '',
  description: '',
  sort_order: '0',
}

export const Route = createFileRoute('/_authenticated/admin/categories/')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({
    keyword: search.keyword,
  }),
  loader: async ({ deps }) => {
    const categories = await listCategoriesAdminFn({
      data: {
        keyword: deps.keyword,
      },
    })
    return { categories }
  },
  component: AdminCategoriesPage,
})

function AdminCategoriesPage() {
  const { categories } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const router = useRouter()
  const createCategory = useServerFn(createCategoryFn)
  const updateCategory = useServerFn(updateCategoryFn)
  const deleteCategory = useServerFn(deleteCategoryFn)

  const [keyword, setKeyword] = useState(search.keyword ?? '')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null)
  const [form, setForm] = useState<CategoryFormState>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    setKeyword(search.keyword ?? '')
  }, [search.keyword])

  const openCreateDialog = () => {
    setEditingCategory(null)
    setForm(emptyForm)
    setFormError(null)
    setDialogOpen(true)
  }

  const openEditDialog = (category: CategoryItem) => {
    setEditingCategory(category)
    setForm({
      name: category.name,
      description: category.description ?? '',
      sort_order: String(category.sort_order),
    })
    setFormError(null)
    setDialogOpen(true)
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    navigate({
      search: {
        keyword: keyword.trim() || undefined,
      },
    })
  }

  const handleReset = () => {
    setKeyword('')
    navigate({
      search: {
        keyword: undefined,
      },
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      sort_order: Number(form.sort_order || 0),
    }

    try {
      if (editingCategory) {
        await updateCategory({ data: { id: editingCategory.id, ...payload } })
      } else {
        await createCategory({ data: payload })
      }
      setDialogOpen(false)
      await router.invalidate()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '保存失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openDeleteDialog = (category: CategoryItem) => {
    setDeleteTarget(category)
    setDeleteError(null)
    setDeleteDialogOpen(true)
  }

  const handleDeleteDialogOpenChange = (open: boolean) => {
    setDeleteDialogOpen(open)
    if (!open) {
      setDeleteTarget(null)
      setDeleteError(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return

    setDeleteError(null)
    setIsDeleting(true)

    try {
      await deleteCategory({ data: { id: deleteTarget.id } })
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
      await router.invalidate()
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : '删除失败，请重试')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title='分类管理'
          description='创建和维护 Prompt 分类，用于组织与筛选内容'
          action={
            <Button onClick={openCreateDialog}>
              <Plus data-icon='inline-start' />
              新建分类
            </Button>
          }
        />
      }
      contentClassName='space-y-6 p-6'
    >
      <form onSubmit={handleSearch} className='border-border bg-card rounded-xl border p-4'>
        <div className={FILTER_FORM_GRID_CLASS}>
          <div className={FILTER_FIELD_CLASS}>
            <Label htmlFor='keyword' className={FILTER_LABEL_CLASS}>
              关键词
            </Label>
            <Input
              id='keyword'
              name='keyword'
              className='min-w-0 flex-1'
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder='搜索分类名称或描述'
            />
          </div>
          <div className={FILTER_ACTIONS_CLASS}>
            <Button type='submit' className='min-w-24'>
              <Search data-icon='inline-start' />
              查询
            </Button>
            <Button type='button' variant='outline' className='min-w-24' onClick={handleReset}>
              重置
            </Button>
          </div>
        </div>
      </form>

      <div className='border-border bg-card overflow-hidden rounded-xl border'>
        <div className='overflow-x-auto'>
          <table className='w-full min-w-[920px] table-fixed text-left text-sm'>
            <colgroup>
              <col className='w-16' />
              <col className='w-48' />
              <col />
              <col className='w-24' />
              <col className='w-40' />
              <col className='w-40' />
              <col className='w-44' />
            </colgroup>
            <thead className='border-border bg-muted/40 border-b'>
              <tr>
                <th className='px-4 py-3 font-medium whitespace-nowrap'>ID</th>
                <th className='px-4 py-3 font-medium whitespace-nowrap'>名称</th>
                <th className='px-4 py-3 font-medium whitespace-nowrap'>描述</th>
                <th className='px-4 py-3 font-medium whitespace-nowrap'>排序</th>
                <th className='px-4 py-3 font-medium whitespace-nowrap'>创建时间</th>
                <th className='px-4 py-3 font-medium whitespace-nowrap'>更新时间</th>
                <th className='bg-muted sticky right-0 z-20 px-4 py-3 font-medium whitespace-nowrap shadow-[-12px_0_18px_-18px_rgba(0,0,0,0.8)]'>
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={7} className='text-muted-foreground px-4 py-12 text-center'>
                    <div className='flex flex-col items-center gap-2'>
                      <FolderTree className='text-muted-foreground/60 size-8' />
                      <p>暂无分类，点击右上角新建分类</p>
                    </div>
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className='border-border/70 border-b last:border-0'>
                    <td className='text-muted-foreground px-4 py-3'>{category.id}</td>
                    <td className='px-4 py-3 font-medium'>{category.name}</td>
                    <td className='text-muted-foreground px-4 py-3'>
                      <p className='line-clamp-2'>{category.description || '-'}</p>
                    </td>
                    <td className='px-4 py-3 whitespace-nowrap'>{category.sort_order}</td>
                    <td className='text-muted-foreground px-4 py-3 whitespace-nowrap'>
                      {format(category.created_at, 'yyyy-MM-dd HH:mm')}
                    </td>
                    <td className='text-muted-foreground px-4 py-3 whitespace-nowrap'>
                      {format(category.updated_at, 'yyyy-MM-dd HH:mm')}
                    </td>
                    <td className='bg-card sticky right-0 z-10 px-4 py-3 shadow-[-12px_0_18px_-18px_rgba(0,0,0,0.8)]'>
                      <div className='flex gap-2'>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() => openEditDialog(category)}
                        >
                          <Pencil data-icon='inline-start' />
                          编辑
                        </Button>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          disabled={isDeleting && deleteTarget?.id === category.id}
                          onClick={() => openDeleteDialog(category)}
                        >
                          <Trash2 data-icon='inline-start' />
                          删除
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className='border-border border-t px-4 py-3'>
          <p className='text-muted-foreground text-sm'>共 {categories.length} 个分类</p>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除分类</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除分类「{deleteTarget?.name}」吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className='text-destructive text-sm'>{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault()
                void handleConfirmDelete()
              }}
            >
              {isDeleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>{editingCategory ? '编辑分类' : '新建分类'}</DialogTitle>
            <DialogDescription>
              {editingCategory ? '修改分类名称、描述和排序权重。' : '填写分类信息后即可保存。'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='category-name'>名称</Label>
              <Input
                id='category-name'
                value={form.name}
                onChange={(e) => setForm((previous) => ({ ...previous, name: e.target.value }))}
                placeholder='例如：人物肖像'
                required
                maxLength={50}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='category-description'>描述</Label>
              <Textarea
                id='category-description'
                value={form.description}
                onChange={(e) =>
                  setForm((previous) => ({ ...previous, description: e.target.value }))
                }
                placeholder='可选，简要说明该分类的用途'
                rows={3}
                maxLength={200}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='category-sort-order'>排序</Label>
              <Input
                id='category-sort-order'
                type='number'
                min={0}
                max={9999}
                value={form.sort_order}
                onChange={(e) =>
                  setForm((previous) => ({ ...previous, sort_order: e.target.value }))
                }
              />
              <p className='text-muted-foreground text-xs'>数字越小越靠前，默认为 0</p>
            </div>

            {formError && <p className='text-destructive text-sm'>{formError}</p>}

            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? '保存中...' : editingCategory ? '保存修改' : '创建分类'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  )
}
