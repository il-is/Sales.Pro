import axios from 'axios'

interface WildberriesConfig {
  apiKey: string
}

interface StockItem {
  barcode: string
  article: string
  name: string
  quantity: number
  inWayToClient: number
  inWayFromClient: number
}

interface WarehouseOperation {
  id: string
  date: string
  operationType: string
  items: Array<{
    barcode: string
    quantity: number
  }>
}

/**
 * Сервис для работы с API Wildberries
 * Документация: https://dev.wildberries.ru/openapi/api-information
 * 
 * Основные эндпоинты:
 * - Statistics API: https://statistics-api.wildberries.ru
 * - Supplier API: https://suppliers-api.wildberries.ru
 */
export class WildberriesService {
  private apiKey: string
  private statisticsURL = 'https://statistics-api.wildberries.ru'
  private supplierURL = 'https://suppliers-api.wildberries.ru'

  constructor(config: WildberriesConfig) {
    this.apiKey = config.apiKey
  }

  private getHeaders() {
    return {
      Authorization: this.apiKey,
      'Content-Type': 'application/json',
    }
  }

  /**
   * Получить данные о складских остатках (FBS)
   * GET /api/v1/supplier/stocks
   */
  async getStocks(dateFrom?: string): Promise<StockItem[]> {
    try {
      if (process.env.NODE_ENV === 'development' && !this.apiKey) {
        return this.getMockStocks()
      }

      const response = await axios.get(`${this.statisticsURL}/api/v1/supplier/stocks`, {
        headers: this.getHeaders(),
        params: {
          dateFrom: dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      })

      return response.data
    } catch (error: any) {
      console.error('Wildberries API error (stocks):', error.response?.data || error.message)
      if (process.env.NODE_ENV === 'development') {
        return this.getMockStocks()
      }
      throw error
    }
  }

  /**
   * Получить данные о поставках FBS (Fulfillment by Seller)
   * GET /api/v1/supplier/incomes
   * 
   * Возвращает данные о поступлениях товаров на склад FBS
   * Структура ответа: массив объектов с полями:
   * - incomeId: номер поступления
   * - number: номер поставки
   * - date: дата поступления
   * - quantity: количество товара
   * - и другие поля
   */
  async getFBSIncomes(dateFrom?: string, dateTo?: string): Promise<any[]> {
    try {
      if (process.env.NODE_ENV === 'development' && !this.apiKey) {
        return this.getMockFBSIncomes()
      }

      const params: any = {}
      if (dateFrom) {
        params.dateFrom = dateFrom.includes('T') ? dateFrom.split('T')[0] : dateFrom
      } else {
        params.dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
      
      if (dateTo) {
        params.dateTo = dateTo.includes('T') ? dateTo.split('T')[0] : dateTo
      } else {
        params.dateTo = new Date().toISOString().split('T')[0]
      }

      console.log('Fetching FBS incomes with params:', params)

      const response = await axios.get(`${this.statisticsURL}/api/v1/supplier/incomes`, {
        headers: this.getHeaders(),
        params,
      })

      console.log('FBS incomes response:', {
        count: response.data?.length || 0,
        sample: response.data?.slice(0, 2),
      })

      return response.data || []
    } catch (error: any) {
      console.error('Wildberries API error (FBS incomes):', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        params: error.config?.params,
      })
      if (process.env.NODE_ENV === 'development') {
        return this.getMockFBSIncomes()
      }
      throw error
    }
  }

  /**
   * Получить данные о поставках FBO (Fulfillment by WB)
   * GET /api/v1/supplier/supplies
   * 
   * Возвращает данные о поставках товаров на склад FBO
   * Структура ответа: массив объектов с полями:
   * - supplyId: номер поставки
   * - name: название поставки
   * - createdAt: дата создания
   * - itemsCount: общее количество товаров
   * - items: массив товаров с quantity
   */
  async getFBOSupplies(dateFrom?: string, dateTo?: string): Promise<any[]> {
    try {
      if (process.env.NODE_ENV === 'development' && !this.apiKey) {
        return this.getMockFBOSupplies()
      }

      const params: any = {}
      if (dateFrom) {
        params.dateFrom = dateFrom.includes('T') ? dateFrom.split('T')[0] : dateFrom
      } else {
        params.dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
      
      if (dateTo) {
        params.dateTo = dateTo.includes('T') ? dateTo.split('T')[0] : dateTo
      } else {
        params.dateTo = new Date().toISOString().split('T')[0]
      }

      console.log('Fetching FBO supplies with params:', params)

      const response = await axios.get(`${this.statisticsURL}/api/v1/supplier/supplies`, {
        headers: this.getHeaders(),
        params,
      })

      // Фильтруем поставки по дате, если API не фильтрует правильно
      let supplies = response.data || []
      
      if (dateFrom && dateTo) {
        const fromDate = new Date(dateFrom)
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999) // Включаем весь последний день
        
        supplies = supplies.filter((supply: any) => {
          if (!supply.createdAt) return false
          const supplyDate = new Date(supply.createdAt)
          return supplyDate >= fromDate && supplyDate <= toDate
        })
      }

      // Подсчитываем общее количество
      const totalQuantity = supplies.reduce((sum: number, supply: any) => {
        if (supply.itemsCount !== undefined) {
          return sum + supply.itemsCount
        }
        if (supply.items && Array.isArray(supply.items)) {
          return sum + supply.items.reduce(
            (itemSum: number, item: any) => itemSum + (item.quantity || 0),
            0
          )
        }
        return sum
      }, 0)

      console.log('FBO supplies response:', {
        totalCount: response.data?.length || 0,
        filteredCount: supplies.length,
        totalQuantity: totalQuantity,
        sample: supplies.slice(0, 3).map((s: any) => ({
          createdAt: s.createdAt,
          itemsCount: s.itemsCount,
          itemsLength: s.items?.length,
          name: s.name,
        })),
      })

      return supplies
    } catch (error: any) {
      console.error('Wildberries API error (FBO supplies):', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        params: error.config?.params,
      })
      if (process.env.NODE_ENV === 'development') {
        return this.getMockFBOSupplies()
      }
      throw error
    }
  }

  /**
   * Получить данные о заказах (FBS)
   * GET /api/v1/supplier/orders
   * 
   * Возвращает данные о заказах FBS (отгруженных к покупателям)
   * Структура ответа: массив объектов с полями:
   * - date: дата заказа
   * - quantity: количество товара
   * - isCancel: отменен ли заказ
   * - и другие поля
   */
  async getFBSOrders(dateFrom?: string, dateTo?: string): Promise<any[]> {
    try {
      if (process.env.NODE_ENV === 'development' && !this.apiKey) {
        return this.getMockFBSOrders()
      }

      const params: any = {}
      if (dateFrom) {
        params.dateFrom = dateFrom.includes('T') ? dateFrom.split('T')[0] : dateFrom
      } else {
        params.dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
      
      if (dateTo) {
        params.dateTo = dateTo.includes('T') ? dateTo.split('T')[0] : dateTo
      } else {
        params.dateTo = new Date().toISOString().split('T')[0]
      }

      console.log('Fetching FBS orders with params:', params)

      const response = await axios.get(`${this.statisticsURL}/api/v1/supplier/orders`, {
        headers: this.getHeaders(),
        params,
      })

      // Фильтруем только неотмененные заказы и заказы в нужном периоде
      let orders = response.data || []
      
      // Фильтруем по дате, если API не фильтрует правильно
      if (dateFrom && dateTo) {
        const fromDate = new Date(dateFrom)
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999) // Включаем весь последний день
        
        orders = orders.filter((order: any) => {
          if (!order.date) return false
          const orderDate = new Date(order.date)
          return orderDate >= fromDate && orderDate <= toDate
        })
      }

      // Фильтруем отмененные заказы
      orders = orders.filter((order: any) => !order.isCancel)

      console.log('FBS orders response:', {
        totalCount: response.data?.length || 0,
        filteredCount: orders.length,
        totalQuantity: orders.reduce((sum: number, o: any) => sum + (o.quantity || 0), 0),
        sample: orders.slice(0, 3).map((o: any) => ({
          date: o.date,
          quantity: o.quantity,
          isCancel: o.isCancel,
        })),
      })

      return orders
    } catch (error: any) {
      console.error('Wildberries API error (FBS orders):', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        params: error.config?.params,
      })
      if (process.env.NODE_ENV === 'development') {
        return this.getMockFBSOrders()
      }
      throw error
    }
  }

  /**
   * Получить операции склада (приемка, отгрузка, перемещения)
   * GET /api/v1/supplier/warehouses
   */
  async getWarehouseOperations(dateFrom: string, dateTo: string): Promise<WarehouseOperation[]> {
    try {
      if (process.env.NODE_ENV === 'development' && !this.apiKey) {
        return this.getMockWarehouseOperations(dateFrom, dateTo)
      }

      const response = await axios.get(`${this.statisticsURL}/api/v1/supplier/warehouses`, {
        headers: this.getHeaders(),
        params: {
          dateFrom: dateFrom.split('T')[0],
          dateTo: dateTo.split('T')[0],
        },
      })

      return response.data
    } catch (error: any) {
      console.error('Wildberries API error (warehouses):', error.response?.data || error.message)
      if (process.env.NODE_ENV === 'development') {
        return this.getMockWarehouseOperations(dateFrom, dateTo)
      }
      throw error
    }
  }

  /**
   * Получить данные о хранении товаров
   */
  async getStorageData(dateFrom: string, dateTo: string): Promise<any> {
    try {
      if (process.env.NODE_ENV === 'development' || !this.apiKey) {
        return this.getMockStorageData(dateFrom, dateTo)
      }

      // Здесь будет реальный запрос к API Wildberries
      // Пример эндпоинта: /api/v1/supplier/storage
      return this.getMockStorageData(dateFrom, dateTo)
    } catch (error: any) {
      console.error('Wildberries API error:', error)
      return this.getMockStorageData(dateFrom, dateTo)
    }
  }

  /**
   * Проверка валидности API ключа
   */
  async validateApiKey(): Promise<boolean> {
    try {
      if (process.env.NODE_ENV === 'development' || !this.apiKey) {
        return true
      }

      // Пробуем сделать простой запрос для проверки ключа
      await axios.get(`${this.statisticsURL}/api/v1/supplier/stocks`, {
        headers: this.getHeaders(),
        params: {
          dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        timeout: 5000,
      })

      return true
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        return false
      }
      // Для демо при других ошибках возвращаем true
      if (process.env.NODE_ENV === 'development') {
        return true
      }
      return false
    }
  }

  // Моковые данные для локальной разработки
  private getMockStocks(): StockItem[] {
    return [
      {
        barcode: '2000000000001',
        article: 'WB-TEST-001',
        name: 'Тестовый товар 1',
        quantity: 150,
        inWayToClient: 20,
        inWayFromClient: 5,
      },
      {
        barcode: '2000000000002',
        article: 'WB-TEST-002',
        name: 'Тестовый товар 2',
        quantity: 85,
        inWayToClient: 10,
        inWayFromClient: 2,
      },
      {
        barcode: '2000000000003',
        article: 'WB-TEST-003',
        name: 'Тестовый товар 3',
        quantity: 200,
        inWayToClient: 30,
        inWayFromClient: 8,
      },
    ]
  }

  private getMockWarehouseOperations(dateFrom: string, dateTo: string): WarehouseOperation[] {
    return [
      {
        id: 'op-001',
        date: new Date().toISOString(),
        operationType: 'RECEIVING',
        items: [
          { barcode: '2000000000001', quantity: 50 },
          { barcode: '2000000000002', quantity: 30 },
        ],
      },
      {
        id: 'op-002',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        operationType: 'SHIPPING',
        items: [
          { barcode: '2000000000001', quantity: 20 },
          { barcode: '2000000000003', quantity: 15 },
        ],
      },
    ]
  }

  private getMockStorageData(dateFrom: string, dateTo: string): any {
    return {
      totalStorageArea: 500, // м²
      averageOccupancy: 0.75,
      items: [
        {
          barcode: '2000000000001',
          storageDays: 30,
          areaUsed: 10.5,
        },
        {
          barcode: '2000000000002',
          storageDays: 15,
          areaUsed: 5.2,
        },
      ],
    }
  }

  private getMockFBSIncomes(): any[] {
    return [
      {
        incomeId: 123456,
        number: 'WB-GI-123456',
        date: new Date().toISOString(),
        lastChangeDate: new Date().toISOString(),
        supplierArticle: 'TEST-001',
        techSize: '42',
        barcode: '2000000000001',
        quantity: 50,
        totalPrice: 25000,
        dateClose: null,
        warehouseName: 'Склад приемки',
        nmId: 12345678,
        status: 'Принято',
      },
      {
        incomeId: 123457,
        number: 'WB-GI-123457',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        lastChangeDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        supplierArticle: 'TEST-002',
        techSize: '44',
        barcode: '2000000000002',
        quantity: 30,
        totalPrice: 15000,
        dateClose: null,
        warehouseName: 'Склад приемки',
        nmId: 12345679,
        status: 'Принято',
      },
    ]
  }

  private getMockFBOSupplies(): any[] {
    return [
      {
        supplyId: 'WB-GI-789012',
        name: 'Поставка #1',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        closedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        scanDt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        isLargeCargo: false,
        itemsCount: 100,
        items: [
          {
            barcode: '2000000000001',
            article: 'TEST-001',
            quantity: 50,
          },
          {
            barcode: '2000000000002',
            article: 'TEST-002',
            quantity: 30,
          },
        ],
      },
    ]
  }

  private getMockFBSOrders(): any[] {
    return [
      {
        date: new Date().toISOString(),
        lastChangeDate: new Date().toISOString(),
        supplierArticle: 'TEST-001',
        techSize: '42',
        barcode: '2000000000001',
        quantity: 5,
        totalPrice: 2500,
        discountPercent: 10,
        warehouseName: 'Склад отгрузки',
        oblast: 'Московская область',
        incomeID: 123456,
        odid: 987654321,
        nmId: 12345678,
        subject: 'Одежда',
        category: 'Платья',
        brand: 'Test Brand',
        isCancel: false,
        cancel_dt: null,
        gNumber: 'G123456789',
        sticker: 'WB-GT-123456',
      },
    ]
  }
}
