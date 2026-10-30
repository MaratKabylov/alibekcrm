import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Quote, CompanySettings } from '@/types/database';
import { registerPDFFonts } from './fonts';

registerPDFFonts();

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 9,
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 35,
    color: '#1E293B',
    lineHeight: 1.3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1.5,
    borderBottomColor: '#2563EB',
    paddingBottom: 14,
    marginBottom: 16,
  },
  companyBlock: {
    width: '60%',
  },
  companyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  companyDetails: {
    fontSize: 8,
    color: '#64748B',
    lineHeight: 1.35,
  },
  docMetaBlock: {
    width: '38%',
    alignItems: 'flex-end',
    textAlign: 'right',
  },
  docTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 4,
  },
  docNumber: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 3,
  },
  docDate: {
    fontSize: 8.5,
    color: '#475569',
    marginBottom: 2,
  },
  docValid: {
    fontSize: 8.5,
    color: '#D97706',
    fontWeight: 'bold',
  },

  // Карточка получателя
  recipientCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recipientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recipientCol: {
    width: '49%',
  },
  recipientText: {
    fontSize: 8.5,
    color: '#1E293B',
    marginBottom: 2,
  },
  boldLabel: {
    fontWeight: 'bold',
    color: '#475569',
  },

  // Таблица товаров
  tableTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 3,
    marginBottom: 14,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingVertical: 5,
    fontWeight: 'bold',
    fontSize: 8,
    color: '#334155',
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.8,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 5,
    fontSize: 8,
    alignItems: 'center',
  },
  tableRowEven: {
    backgroundColor: '#FFFFFF',
  },
  tableRowOdd: {
    backgroundColor: '#FBFCFE',
  },
  colNum: {
    width: '5%',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  colSku: {
    width: '13%',
    paddingHorizontal: 4,
    fontFamily: 'Roboto',
    fontSize: 7.5,
    color: '#64748B',
  },
  colName: {
    width: '38%',
    paddingHorizontal: 4,
  },
  colQty: {
    width: '12%',
    textAlign: 'center',
    paddingHorizontal: 3,
  },
  colPrice: {
    width: '14%',
    textAlign: 'right',
    paddingHorizontal: 4,
  },
  colDisc: {
    width: '6%',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  colTotal: {
    width: '12%',
    textAlign: 'right',
    paddingHorizontal: 4,
    fontWeight: 'bold',
  },
  itemName: {
    fontWeight: 'bold',
    color: '#0F172A',
  },
  itemSpecs: {
    fontSize: 7,
    color: '#64748B',
    marginTop: 2,
  },

  // Сборы и доплаты
  chargesCard: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 4,
    padding: 8,
    marginBottom: 14,
  },
  chargeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2.5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F3E8FF',
    fontSize: 8,
  },

  // Итоговая плашка
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  totalsBox: {
    width: '45%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    fontSize: 8.5,
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 5,
    marginTop: 4,
    borderTopWidth: 1.5,
    borderTopColor: '#0F172A',
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#0F172A',
  },

  // Условия
  termsCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 9,
    marginBottom: 18,
    fontSize: 8,
    color: '#334155',
  },
  termsTitle: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  termLine: {
    marginBottom: 2.5,
  },

  // Подписи сторон
  signaturesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
  },
  signatureCol: {
    width: '46%',
  },
  signaturePartyTitle: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  signLine: {
    marginTop: 22,
    borderBottomWidth: 1,
    borderBottomColor: '#94A3B8',
    marginBottom: 3,
  },
  signNote: {
    fontSize: 7,
    color: '#94A3B8',
    textAlign: 'center',
  },

  // Подвал страницы
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 35,
    right: 35,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#CBD5E1',
    paddingTop: 5,
    fontSize: 7,
    color: '#94A3B8',
  },
});

interface QuotePDFDocumentProps {
  quote: Quote;
  settings?: CompanySettings;
}

function formatNum(num: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

export function QuotePDFDocument({ quote, settings }: QuotePDFDocumentProps) {
  const version = quote.current_version;
  const items = version?.items || [];
  const charges = version?.charges || [];

  const createdDate = new Date(quote.created_at || Date.now()).toLocaleDateString('ru-RU');
  const validUntilDate = quote.valid_until 
    ? new Date(quote.valid_until).toLocaleDateString('ru-RU')
    : '—';

  const companyName = settings?.company_name || 'PackCoffee Kazakhstan';
  const legalName = settings?.legal_name || 'ТОО "PackCoffee KZ"';
  const bin = settings?.bin_iin || '120440019283';
  const address = settings?.address || 'Республика Казахстан, г. Алматы';
  const phone = settings?.phone || '+7 (727) 312-34-56';
  const email = settings?.email || 'sales@packcoffee.kz';
  const bank = settings?.bank_details || 'АО "Kaspi Bank", БИК CASPKZKA';

  return (
    <Document title={`КП ${quote.quote_number}`} author={companyName}>
      <Page size="A4" style={styles.page}>
        {/* Шапка: Поставщик слева, Мета-данные КП справа */}
        <View style={styles.headerRow}>
          <View style={styles.companyBlock}>
            <Text style={styles.companyTitle}>{companyName}</Text>
            <Text style={styles.companyDetails}>{legalName} | БИН/ИИН: {bin}</Text>
            <Text style={styles.companyDetails}>{address}</Text>
            <Text style={styles.companyDetails}>Тел: {phone} | E-mail: {email}</Text>
            {bank ? <Text style={styles.companyDetails}>Банк: {bank}</Text> : null}
          </View>

          <View style={styles.docMetaBlock}>
            <Text style={styles.docTitle}>КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</Text>
            <Text style={styles.docNumber}>№ {quote.quote_number} (v{version?.version_number || 1})</Text>
            <Text style={styles.docDate}>Дата: {createdDate}</Text>
            <Text style={styles.docValid}>Действительно до: {validUntilDate}</Text>
          </View>
        </View>

        {/* Карточка заказчика / получателя */}
        <View style={styles.recipientCard}>
          <Text style={styles.cardTitle}>Заказчик / Грузополучатель</Text>
          <View style={styles.recipientRow}>
            <View style={styles.recipientCol}>
              <Text style={styles.recipientText}>
                <Text style={styles.boldLabel}>Организация: </Text>
                {quote.recipient_company || quote.recipient_name || 'Не указана'}
              </Text>
              <Text style={styles.recipientText}>
                <Text style={styles.boldLabel}>Контактное лицо: </Text>
                {quote.recipient_name || '—'}
              </Text>
            </View>
            <View style={styles.recipientCol}>
              <Text style={styles.recipientText}>
                <Text style={styles.boldLabel}>Телефон: </Text>
                {quote.recipient_phone || '—'}
              </Text>
              <Text style={styles.recipientText}>
                <Text style={styles.boldLabel}>E-mail: </Text>
                {quote.recipient_email || '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Таблица спецификации товаров */}
        <Text style={styles.tableTitle}>Спецификация товаров и тиражей (Снимок цен и параметров)</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colNum}>№</Text>
            <Text style={styles.colSku}>Артикул</Text>
            <Text style={styles.colName}>Наименование и характеристики</Text>
            <Text style={styles.colQty}>Тираж</Text>
            <Text style={styles.colPrice}>Цена (₸)</Text>
            <Text style={styles.colDisc}>Скидка</Text>
            <Text style={styles.colTotal}>Сумма (₸)</Text>
          </View>

          {items.map((item, idx) => {
            const specs = Object.entries(item.characteristics_snapshot || {})
              .map(([k, v]) => (v ? `${k}: ${v}` : ''))
              .filter(Boolean)
              .join(' | ');

            const rowStyle = [
              styles.tableRow,
              idx % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
            ];

            return (
              <View key={item.id || idx} style={rowStyle} wrap={false}>
                <Text style={styles.colNum}>{idx + 1}</Text>
                <Text style={styles.colSku}>{item.sku_snapshot || '—'}</Text>
                <View style={styles.colName}>
                  <Text style={styles.itemName}>{item.name_snapshot}</Text>
                  {specs ? <Text style={styles.itemSpecs}>{specs}</Text> : null}
                </View>
                <Text style={styles.colQty}>
                  {formatNum(item.quantity)} {item.unit_snapshot || 'шт'}
                </Text>
                <Text style={styles.colPrice}>{formatNum(item.base_unit_price)}</Text>
                <Text style={styles.colDisc}>
                  {item.discount_percent > 0 ? `${item.discount_percent}%` : '—'}
                </Text>
                <Text style={styles.colTotal}>{formatNum(item.item_subtotal)}</Text>
              </View>
            );
          })}
        </View>

        {/* Дополнительные услуги и сборы (если есть) */}
        {charges.length > 0 && (
          <View style={styles.chargesCard} wrap={false}>
            <Text style={{ fontSize: 8.5, fontWeight: 'bold', color: '#6B21A8', marginBottom: 4 }}>
              Дополнительные сборы, клише и услуги:
            </Text>
            {charges.map((charge, idx) => (
              <View key={charge.id || idx} style={styles.chargeRow}>
                <Text style={{ width: '50%', color: '#3B0764' }}>
                  {charge.name_snapshot} {charge.reason ? `(${charge.reason})` : ''}
                </Text>
                <Text style={{ width: '25%', color: '#6B21A8' }}>
                  {charge.quantity} шт. × {formatNum(charge.unit_price)} ₸
                </Text>
                <Text style={{ width: '25%', textAlign: 'right', fontWeight: 'bold', color: '#581C87' }}>
                  {formatNum(charge.total_charge)} ₸
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Итоги */}
        <View style={styles.totalsContainer} wrap={false}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={{ color: '#64748B' }}>Сумма по товарам:</Text>
              <Text style={{ fontWeight: 'bold' }}>{formatNum(version?.subtotal || 0)} ₸</Text>
            </View>

            {version?.total_surcharges ? (
              <View style={styles.totalRow}>
                <Text style={{ color: '#64748B' }}>Сборы и услуги:</Text>
                <Text style={{ fontWeight: 'bold' }}>{formatNum(version.total_surcharges)} ₸</Text>
              </View>
            ) : null}

            {version?.total_discount ? (
              <View style={styles.totalRow}>
                <Text style={{ color: '#64748B' }}>Сумма скидки:</Text>
                <Text style={{ color: '#16A34A', fontWeight: 'bold' }}>
                  -{formatNum(version.total_discount)} ₸
                </Text>
              </View>
            ) : null}

            <View style={styles.totalRowFinal}>
              <Text>ИТОГО К ОПЛАТЕ:</Text>
              <Text>{formatNum(version?.total_amount || 0)} ₸</Text>
            </View>
          </View>
        </View>

        {/* Условия поставки и оплаты */}
        <View style={styles.termsCard} wrap={false}>
          <Text style={styles.termsTitle}>Условия сделки и поставки:</Text>
          <Text style={styles.termLine}>
            <Text style={{ fontWeight: 'bold' }}>Условия оплаты: </Text>
            {quote.payment_terms || '100% предоплата перед запуском в производство'}
          </Text>
          <Text style={styles.termLine}>
            <Text style={{ fontWeight: 'bold' }}>Сроки производства: </Text>
            {quote.production_terms || '10-14 рабочих дней с момента утверждения макета'}
          </Text>
          <Text style={styles.termLine}>
            <Text style={{ fontWeight: 'bold' }}>Условия доставки: </Text>
            {quote.delivery_terms || 'Самовывоз со склада поставщика'}
          </Text>
        </View>

        {/* Подписи сторон */}
        <View style={styles.signaturesRow} wrap={false}>
          <View style={styles.signatureCol}>
            <Text style={styles.signaturePartyTitle}>От Поставщика:</Text>
            <Text style={{ fontSize: 8, color: '#475569' }}>{legalName}</Text>
            <View style={styles.signLine} />
            <Text style={styles.signNote}>М.П. / Подпись ответственного лица</Text>
          </View>

          <View style={styles.signatureCol}>
            <Text style={styles.signaturePartyTitle}>От Заказчика:</Text>
            <Text style={{ fontSize: 8, color: '#475569' }}>
              {quote.recipient_company || quote.recipient_name || 'Заказчик'}
            </Text>
            <View style={styles.signLine} />
            <Text style={styles.signNote}>Согласовано / Подпись уполномоченного лица</Text>
          </View>
        </View>

        {/* Подвал страницы */}
        <View style={styles.footer} fixed>
          <Text>Документ сформирован автоматически в Alibek CRM • Не является публичной офертой</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Страница ${pageNumber} из ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

