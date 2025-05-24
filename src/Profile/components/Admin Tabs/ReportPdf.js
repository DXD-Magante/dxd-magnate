import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  date: {
    fontSize: 10,
    color: '#666',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f5f5f5',
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCellHeader: {
    margin: 5,
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableCell: {
    margin: 5,
    fontSize: 10,
  },
});

const ReportPDF = ({ data, includeCharts, includeDetails }) => {
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.date}>Generated on: {formatDate(data.createdAt)}</Text>
        </View>

        {data.type === 'performance' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Key Metrics</Text>
              <View style={styles.table}>
                <View style={styles.tableRow}>
                  <View style={styles.tableColHeader}>
                    <Text style={styles.tableCellHeader}>Metric</Text>
                  </View>
                  <View style={styles.tableColHeader}>
                    <Text style={styles.tableCellHeader}>Value</Text>
                  </View>
                </View>
                <View style={styles.tableRow}>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>Active Projects</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{data.data.metrics.activeProjects}</Text>
                  </View>
                </View>
                <View style={styles.tableRow}>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>Team Members</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{data.data.metrics.teamMembers}</Text>
                  </View>
                </View>
                {/* Add more metrics as needed */}
              </View>
            </View>

            {includeDetails && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Detailed Metrics</Text>
                {/* Add detailed metrics here */}
              </View>
            )}
          </>
        )}

{data.type === 'financial' && (
  <>
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Financial Summary</Text>
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>Metric</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>Value</Text>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Total Revenue</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>₹{data.data.totalRevenue.toLocaleString()}</Text>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Total Projects</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>{data.data.totalProjects}</Text>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Average Revenue</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>₹{data.data.avgRevenue.toLocaleString(undefined, {maximumFractionDigits: 2})}</Text>
          </View>
        </View>
      </View>
    </View>

    {includeDetails && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction Details</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Client</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Project</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Amount</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Date</Text>
            </View>
          </View>
          {data.data.transactions.map((txn, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{txn.clientName}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{txn.projectTitle}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>₹{txn.amount.toLocaleString()}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{txn.date}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    )}
  </>
)}

        {data.type === 'project' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Project Status</Text>
              <View style={styles.table}>
                <View style={styles.tableRow}>
                  <View style={styles.tableColHeader}>
                    <Text style={styles.tableCellHeader}>Metric</Text>
                  </View>
                  <View style={styles.tableColHeader}>
                    <Text style={styles.tableCellHeader}>Value</Text>
                  </View>
                </View>
                <View style={styles.tableRow}>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>Total Projects</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{data.data.totalProjects}</Text>
                  </View>
                </View>
                {/* Add more project metrics as needed */}
              </View>
            </View>
          </>
        )}
      </Page>
    </Document>
  );
};

export default ReportPDF;