import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { request } from "../../utils/axios";
import {
  PDFViewer,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import moment from "moment";
import {
  Table,
  TableHeader,
  TableCell,
  TableBody,
  DataTableCell,
} from "@david.kucsai/react-pdf-table";

const styles = StyleSheet.create({
  page: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },

  logo: {
    width: "50px",
    height: "50px",
  },
  viewer: {
    width: "100vw",
    height: "100vh",
  },
});

const InvoiceTemplate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);
  const [reportData, setReportData] = useState([]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await request(`/wellness-survey/report/${id}`, "GET", {
          Authorization: `Bearer ${token}`,
        });
        console.log(data);
        if (data.success) {
          setReportData(data);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchReport();
  }, []);

  return (
    <PDFViewer style={styles.viewer}>
      <Document>
        <Page>
          <View style={styles.header}>
            <Image
              source={require("../../assets/hospital_icon.png")}
              style={styles.logo}
            />
            <Text>SAGIP{"\n"}City of Malolos</Text>

            <Text>City Disaster Risk Reduction Management Office</Text>
            <Text>1/F New City Hall Building</Text>
            <Text>Brgy. Bulihan, Malolos City, Bulacan</Text>
          </View>

          <View>
            <Text>Wellness Safety Check Survey Report</Text>
            <Text>
              {reportData && reportData.title}{" "}
              {reportData &&
                moment(reportData.date).format("MMMM DD, YYYY HH:mm A")}
            </Text>
            <Text>
              Date Generated{" "}
              {moment(Date.now()).format("MMMM DD, YYYY HH:mm A")}
            </Text>
          </View>

          <View>
            <Text>Affected and Unaffected</Text>
            <Text>{"\n"}</Text>

            <Table
              data={
                reportData &&
                reportData.unaffected &&
                reportData.affected &&
                Object.keys(reportData.unaffected).map((area) => ({
                  area: area,
                  unaffectedCount: reportData.unaffected[area],
                  affectedCount: reportData.affected[area],
                }))
              }
            >
              <TableHeader>
                <TableCell>Barangay</TableCell>
                <TableCell>Unaffected Count</TableCell>
                <TableCell>Affected Count</TableCell>
              </TableHeader>
              <TableBody>
                <DataTableCell getContent={(r) => r.area} />
                <DataTableCell getContent={(r) => r.unaffectedCount} />
                <DataTableCell getContent={(r) => r.affectedCount} />
              </TableBody>
            </Table>
          </View>

          {/* <View>
            <Text>affected</Text>
            <Table
              data={
                reportData &&
                reportData.affected &&
                Object.keys(reportData.affected).map((area) => ({
                  area: area,
                  count: reportData.affected[area],
                }))
              }
            >
              <TableHeader>
                <TableCell>Barangay</TableCell>
                <TableCell>Count</TableCell>
              </TableHeader>
              <TableBody>
                <DataTableCell getContent={(r) => r.area} />
                <DataTableCell getContent={(r) => r.count} />
              </TableBody>
            </Table>
          </View> */}
        </Page>
      </Document>
    </PDFViewer>
  );
};

export default InvoiceTemplate;
