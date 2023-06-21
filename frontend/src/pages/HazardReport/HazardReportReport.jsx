import React from "react";
import {
  PDFViewer,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  table: {
    display: "table",
    width: "auto",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    borderBottomStyle: "solid",
    alignItems: "center",
    height: 30,
  },
  tableCell: {
    width: "25%",
    borderRightWidth: 1,
    borderRightColor: "#000",
    borderRightStyle: "solid",
    padding: 5,
  },
});

const InvoiceTemplate = () => {
  const tableData = [
    {
      firstName: "John",
      lastName: "Smith",
      dob: new Date(2000, 1, 1),
      country: "Australia",
      phoneNumber: "xxx-0000-0000",
    },
  ];

  return (
    <PDFViewer>
      <Document>
        <Page style={styles.page}>
          <View style={styles.header}>
            <Text>Company Name</Text>
            <Text>Company Address</Text>
            <Text>Invoice Report</Text>
          </View>

          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>First Name</Text>
              <Text style={styles.tableCell}>Last Name</Text>
              <Text style={styles.tableCell}>DOB</Text>
              <Text style={styles.tableCell}>Country</Text>
              <Text style={styles.tableCell}>Phone Number</Text>
            </View>
            {tableData.map((row, index) => (
              <View style={styles.tableRow} key={index}>
                <Text style={styles.tableCell}>{row.firstName}</Text>
                <Text style={styles.tableCell}>{row.lastName}</Text>
                <Text style={styles.tableCell}>{row.dob.toLocaleString()}</Text>
                <Text style={styles.tableCell}>{row.country}</Text>
                <Text style={styles.tableCell}>{row.phoneNumber}</Text>
              </View>
            ))}
          </View>
        </Page>
      </Document>
    </PDFViewer>
  );
};

export default InvoiceTemplate;
