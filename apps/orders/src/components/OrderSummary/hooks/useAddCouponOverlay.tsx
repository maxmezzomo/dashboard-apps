import {
  Button,
  HookedForm,
  HookedInput,
  HookedValidationApiError,
  PageLayout,
  Spacer,
  useCoreSdkProvider,
  useOverlay,
  useTranslation
} from '@commercelayer/app-elements'
import type { Order } from '@commercelayer/sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

interface Props {
  order: Order
  onChange?: () => void
  close: () => void
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useAddCouponOverlay(
  order: Props['order'],
  onChange?: Props['onChange']
) {
  const { Overlay, open, close } = useOverlay()

  return {
    close,
    open,
    Overlay: () => (
      <Overlay>
        <Form order={order} onChange={onChange} close={close} />
      </Overlay>
    )
  }
}

const Form: React.FC<Props> = ({ order, onChange, close }) => {
  const { sdkClient } = useCoreSdkProvider()
  const [apiError, setApiError] = useState<string>()
  const { t } = useTranslation()

  const validationSchema = useMemo(
    () =>
      z.object({
        couponCode: z
          .string({
            required_error: t('validation.coupon_code_invalid'),
            invalid_type_error: t('validation.coupon_code_invalid')
          })
          .min(8, {
            message: t('validation.coupon_code_too_short')
          })
      }),
    []
  )

  const formMethods = useForm({
    defaultValues: {
      couponCode: null
    },
    resolver: zodResolver(validationSchema)
  })

  const {
    formState: { isSubmitting }
  } = formMethods

  return (
    <HookedForm
      {...formMethods}
      onSubmit={async (values) => {
        await sdkClient.orders
          .update({
            id: order.id,
            coupon_code: values.couponCode
          })
          .then(() => {
            onChange?.()
            formMethods.reset()
            close()
          })
          .catch((error) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            setApiError(error)
          })
      }}
    >
      <PageLayout
        title={t('common.add_resource', {
          resource: t('resources.coupons.name').toLowerCase()
        })}
        navigationButton={{
          onClick: () => {
            close()
          },
          label: t('common.cancel'),
          icon: 'x'
        }}
      >
        <Spacer bottom='8'>
          <HookedInput
            disabled={isSubmitting}
            label={t('apps.orders.form.coupon_code')}
            name='couponCode'
          />
        </Spacer>
        <Button type='submit' fullWidth disabled={isSubmitting}>
          {t('common.apply')}
        </Button>

        <Spacer top='4'>
          <HookedValidationApiError
            apiError={apiError}
            fieldMap={{
              coupon_code: 'couponCode'
            }}
          />
        </Spacer>
      </PageLayout>
    </HookedForm>
  )
}
