import { BillingService as BillingServiceType } from '@/types/billing'

interface MarketplaceData {
  stocks?: any[]
  fbsIncomes?: any[]
  fboSupplies?: any[]
  fbsOrders?: any[]
  operations?: any[]
  storageData?: any
}

interface CalculationItem {
  serviceId: string
  serviceName: string
  quantity: number
  unit: string
  price: number
  total: number
  operationType?: 'fbs' | 'fbo' // Тип операции для группировки
}

interface BillingCalculations {
  items: CalculationItem[]
  subtotal: number
  total: number
  period: {
    start: string
    end: string
  }
}

/**
 * Сервис для расчета биллинга
 * 
 * Новая логика расчета:
 * 1. FBS: количество единиц из поставок (incomes) типов FBS и FBW умножается на все услуги
 * 2. FBO: количество единиц из отгрузок (orders) типа FBO умножается на все услуги
 */
export class BillingCalculator {
  /**
   * Рассчитать биллинг на основе конфигурации и данных маркетплейса
   */
  static calculateBilling(
    services: BillingServiceType[],
    marketplaceData: MarketplaceData,
    periodStart: Date,
    periodEnd: Date
  ): BillingCalculations {
    const items: CalculationItem[] = []
    let subtotal = 0

    // Получаем только включенные услуги
    const enabledServices = services.filter((s) => s.enabled)

    // 1. Подсчитываем количество единиц FBS/FBW из поставок (incomes)
    let fbsQuantity = 0
    if (marketplaceData.fbsIncomes && Array.isArray(marketplaceData.fbsIncomes)) {
      fbsQuantity = marketplaceData.fbsIncomes.reduce(
        (sum: number, income: any) => {
          // Количество товара в поставке
          const qty = income.quantity || income.inWayToClient || income.inWayFromClient || 0
          return sum + qty
        },
        0
      )
    }

    // 2. Подсчитываем количество единиц FBO из отгрузок (orders)
    let fboQuantity = 0
    if (marketplaceData.fbsOrders && Array.isArray(marketplaceData.fbsOrders)) {
      // Фильтруем только FBO заказы (если есть поле типа, иначе считаем все неотмененные)
      const fboOrders = marketplaceData.fbsOrders.filter((order: any) => {
        // Если есть поле типа заказа, фильтруем по FBO
        // Иначе считаем все неотмененные заказы как FBO
        return !order.isCancel && (order.type === 'FBO' || order.orderType === 'FBO' || !order.type)
      })
      
      fboQuantity = fboOrders.reduce(
        (sum: number, order: any) => {
          const qty = order.quantity || 0
          return sum + qty
        },
        0
      )
    }

    console.log('Billing quantities:', {
      fbsQuantity,
      fboQuantity,
      fbsIncomesCount: marketplaceData.fbsIncomes?.length || 0,
      totalOrdersCount: marketplaceData.fbsOrders?.length || 0,
      fboOrdersCount: marketplaceData.fbsOrders?.filter((o: any) => !o.isCancel && (o.type === 'FBO' || o.orderType === 'FBO' || !o.type)).length || 0,
    })

    // 3. Для каждой услуги умножаем количество FBS и FBO на цену услуги
    for (const service of enabledServices) {
      // Пропускаем специальные услуги, которые имеют свою логику
      if (service.id === 'fbs' || service.id === 'fbo') {
        // FBS и FBO больше не являются услугами, они используются только для группировки
        continue
      }

      // Для специальных услуг (storage, handling) используем их собственную логику
      if (service.id === 'storage') {
        // Хранение: считаем по площади и дням хранения
        if (marketplaceData.storageData?.items) {
          const storageDays = this.calculateStorageDays(periodStart, periodEnd)
          const quantity = marketplaceData.storageData.items.reduce(
            (sum: number, item: any) => sum + (item.areaUsed || 0),
            0
          )
          const total = quantity * service.price * (storageDays / 30) // Приводим к месяцам
          
          if (quantity > 0 || total > 0) {
            items.push({
              serviceId: service.id,
              serviceName: service.name,
              quantity,
              unit: service.unit || 'м²',
              price: service.price,
              total,
            })
            subtotal += total
          }
        }
        continue
      }

      if (service.id === 'handling') {
        // Комплектация: считаем количество заказов
        const ordersCount = marketplaceData.fbsOrders?.filter((o: any) => !o.isCancel).length || 0
        const total = ordersCount * service.price
        
        if (ordersCount > 0 || total > 0) {
          items.push({
            serviceId: service.id,
            serviceName: service.name,
            quantity: ordersCount,
            unit: service.unit || 'заказ',
            price: service.price,
            total,
          })
          subtotal += total
        }
        continue
      }

      // Для всех остальных услуг: умножаем количество FBS и FBO на цену услуги
      
      // FBS расчет
      if (fbsQuantity > 0) {
        const fbsTotal = fbsQuantity * service.price
        items.push({
          serviceId: `${service.id}_fbs`,
          serviceName: `${service.name} (FBS)`,
          quantity: fbsQuantity,
          unit: service.unit || 'шт',
          price: service.price,
          total: fbsTotal,
          operationType: 'fbs',
        })
        subtotal += fbsTotal
      }

      // FBO расчет
      if (fboQuantity > 0) {
        const fboTotal = fboQuantity * service.price
        items.push({
          serviceId: `${service.id}_fbo`,
          serviceName: `${service.name} (FBO)`,
          quantity: fboQuantity,
          unit: service.unit || 'шт',
          price: service.price,
          total: fboTotal,
          operationType: 'fbo',
        })
        subtotal += fboTotal
      }
    }

    return {
      items,
      subtotal,
      total: subtotal,
      period: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
      },
    }
  }

  /**
   * Рассчитать количество дней хранения
   */
  private static calculateStorageDays(start: Date, end: Date): number {
    const diffTime = end.getTime() - start.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Форматировать расчеты для отображения
   */
  static formatCalculations(calculations: BillingCalculations): any {
    return {
      ...calculations,
      items: calculations.items.map((item) => ({
        ...item,
        formattedPrice: new Intl.NumberFormat('ru-RU', {
          style: 'currency',
          currency: 'RUB',
        }).format(item.price),
        formattedTotal: new Intl.NumberFormat('ru-RU', {
          style: 'currency',
          currency: 'RUB',
        }).format(item.total),
      })),
      formattedSubtotal: new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
      }).format(calculations.subtotal),
      formattedTotal: new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
      }).format(calculations.total),
    }
  }
}
