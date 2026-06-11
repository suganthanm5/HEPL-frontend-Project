package com.example.outletmanagement.controller;

import com.example.outletmanagement.entity.*;
import com.example.outletmanagement.repository.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/export")
public class ExportController {

    private final OrderRepository orderRepository;
    private final ProductBatchRepository batchRepository;
    private final OutletStockRepository stockRepository;
    private final com.example.outletmanagement.repository.UserRepository userRepository;
    private final com.example.outletmanagement.repository.OutletRepository outletRepository;
    private final com.example.outletmanagement.repository.ProductRepository productRepository;
    private final com.example.outletmanagement.repository.DivisionRepository divisionRepository;
    private final com.example.outletmanagement.repository.LocationRepository locationRepository;
    private final AuditLogRepository auditLogRepository;

    public ExportController(
            OrderRepository orderRepository,
            ProductBatchRepository batchRepository,
            OutletStockRepository stockRepository,
            com.example.outletmanagement.repository.UserRepository userRepository,
            com.example.outletmanagement.repository.OutletRepository outletRepository,
            com.example.outletmanagement.repository.ProductRepository productRepository,
            com.example.outletmanagement.repository.DivisionRepository divisionRepository,
            com.example.outletmanagement.repository.LocationRepository locationRepository,
            AuditLogRepository auditLogRepository) {
        this.orderRepository = orderRepository;
        this.batchRepository = batchRepository;
        this.stockRepository = stockRepository;
        this.userRepository = userRepository;
        this.outletRepository = outletRepository;
        this.productRepository = productRepository;
        this.divisionRepository = divisionRepository;
        this.locationRepository = locationRepository;
        this.auditLogRepository = auditLogRepository;
    }

    // ── Orders ──────────────────────────────────────────────────────────────
    @GetMapping("/orders")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER', 'USER')")
    public ResponseEntity<byte[]> exportOrders(@RequestParam(defaultValue = "csv") String format) throws IOException {
        List<Order> orders = orderRepository.findAll();
        String[][] data = orders.stream().map(o -> new String[]{
            o.getOrderNo() != null ? o.getOrderNo() : "ORD-" + o.getId(),
            o.getOutlet() != null ? o.getOutlet().getOutletName() : "",
            String.valueOf(o.getItems() != null ? o.getItems().size() : 0),
            o.getStatus() != null ? o.getStatus().name() : "",
            o.getCreatedAt() != null ? o.getCreatedAt().toLocalDate().toString() : ""
        }).toArray(String[][]::new);
        String[] headers = {"Order No", "Outlet", "Items", "Status", "Date"};
        return buildResponse(format, "orders", headers, data);
    }

    // ── Batches ──────────────────────────────────────────────────────────────
    @GetMapping("/batches")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER')")
    public ResponseEntity<byte[]> exportBatches(@RequestParam(defaultValue = "csv") String format) throws IOException {
        List<ProductBatch> batches = batchRepository.findAll();
        String[][] data = batches.stream().map(b -> new String[]{
            b.getBatchNo(),
            b.getProduct() != null ? b.getProduct().getName() : "",
            String.valueOf(b.getQuantity()),
            b.getManufactureDate() != null ? b.getManufactureDate().toString() : "",
            b.getExpiryDate() != null ? b.getExpiryDate().toString() : "",
            b.getPurchasePrice() != null ? b.getPurchasePrice().toString() : "",
            b.getSellingPrice() != null ? b.getSellingPrice().toString() : "",
            b.getStatus() != null ? b.getStatus().name() : ""
        }).toArray(String[][]::new);
        String[] headers = {"Batch No", "Product", "Quantity", "Manufacture Date", "Expiry Date", "Purchase Price", "Selling Price", "Status"};
        return buildResponse(format, "batches", headers, data);
    }

    // ── Stock ────────────────────────────────────────────────────────────────
    @GetMapping("/stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER')")
    public ResponseEntity<byte[]> exportStock(@RequestParam(defaultValue = "csv") String format) throws IOException {
        List<OutletStock> stock = stockRepository.findAll();
        String[][] data = stock.stream().map(s -> new String[]{
            s.getOutlet() != null ? s.getOutlet().getOutletName() : "",
            s.getProduct() != null ? s.getProduct().getName() : "",
            s.getBatch() != null ? s.getBatch().getBatchNo() : "",
            String.valueOf(s.getAvailableQty()),
            String.valueOf(s.getReservedQty())
        }).toArray(String[][]::new);
        String[] headers = {"Outlet", "Product", "Batch", "Available Qty", "Reserved Qty"};
        return buildResponse(format, "stock", headers, data);
    }

    // ── Users ────────────────────────────────────────────────────────────────
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportUsers(@RequestParam(defaultValue = "csv") String format) throws IOException {
        List<User> users = userRepository.findAll();
        String[][] data = users.stream().map(u -> new String[]{
            u.getName() != null ? u.getName() : u.getUsername(),
            u.getUsername(),
            u.getEmail() != null ? u.getEmail() : "",
            u.getRole() != null ? u.getRole().name() : "",
            (u.getIsDeleted() != null && u.getIsDeleted()) ? "Inactive" : "Active"
        }).toArray(String[][]::new);
        String[] headers = {"Name", "Username", "Email", "Role", "Status"};
        return buildResponse(format, "users", headers, data);
    }

    // ── Outlets ──────────────────────────────────────────────────────────────
    @GetMapping("/outlets")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER')")
    public ResponseEntity<byte[]> exportOutlets(@RequestParam(defaultValue = "csv") String format) throws IOException {
        List<Outlet> outlets = outletRepository.findAll();
        String[][] data = outlets.stream().map(o -> new String[]{
            String.valueOf(o.getId()),
            o.getOutletName() != null ? o.getOutletName() : "",
            o.getOutletCode() != null ? o.getOutletCode() : "",
            o.getOutletType() != null ? o.getOutletType() : "",
            o.getLocation() != null ? o.getLocation().getName() : "",
            o.getOwnerName() != null ? o.getOwnerName() : "",
            o.getAddress() != null ? o.getAddress() : ""
        }).toArray(String[][]::new);
        String[] headers = {"ID", "Outlet Name", "Code", "Type", "Location", "Owner Name", "Address"};
        return buildResponse(format, "outlets", headers, data);
    }

    // ── Products ─────────────────────────────────────────────────────────────
    @GetMapping("/products")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER')")
    public ResponseEntity<byte[]> exportProducts(@RequestParam(defaultValue = "csv") String format) throws IOException {
        List<Product> products = productRepository.findAll();
        String[][] data = products.stream().map(p -> new String[]{
            String.valueOf(p.getId()),
            p.getName() != null ? p.getName() : "",
            p.getProductCode() != null ? p.getProductCode() : "",
            p.getDivision() != null ? p.getDivision().getName() : "",
            p.getUimPrice() != null ? p.getUimPrice().toString() : "",
            p.getMrp() != null ? p.getMrp().toString() : "",
            p.getSellingPrice() != null ? p.getSellingPrice().toString() : "",
            p.getPurchasePrice() != null ? p.getPurchasePrice().toString() : ""
        }).toArray(String[][]::new);
        String[] headers = {"ID", "Product Name", "Code", "Division", "UIM Price", "MRP", "Selling Price", "Purchase Price"};
        return buildResponse(format, "products", headers, data);
    }

    // ── Divisions ────────────────────────────────────────────────────────────
    @GetMapping("/divisions")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER')")
    public ResponseEntity<byte[]> exportDivisions(@RequestParam(defaultValue = "csv") String format) throws IOException {
        List<Division> divisions = divisionRepository.findAll();
        String[][] data = divisions.stream().map(d -> new String[]{
            String.valueOf(d.getId()),
            d.getName() != null ? d.getName() : "",
            String.valueOf(d.getProducts() != null ? d.getProducts().size() : 0),
            d.getCreatedAt() != null ? d.getCreatedAt().toLocalDate().toString() : ""
        }).toArray(String[][]::new);
        String[] headers = {"ID", "Division Name", "Total Products", "Created At"};
        return buildResponse(format, "divisions", headers, data);
    }

    // ── Locations ────────────────────────────────────────────────────────────
    @GetMapping("/locations")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OUTLET_MANAGER')")
    public ResponseEntity<byte[]> exportLocations(@RequestParam(defaultValue = "csv") String format) throws IOException {
        List<Location> locations = locationRepository.findAll();
        String[][] data = locations.stream().map(l -> new String[]{
            String.valueOf(l.getId()),
            l.getName() != null ? l.getName() : ""
        }).toArray(String[][]::new);
        String[] headers = {"ID", "Location Name"};
        return buildResponse(format, "locations", headers, data);
    }

    // ── Audit Logs ───────────────────────────────────────────────────────────
    @GetMapping("/audit-logs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportAuditLogs(@RequestParam(defaultValue = "csv") String format) throws IOException {
        List<AuditLog> logs = auditLogRepository.findAll();
        String[][] data = logs.stream().map(al -> new String[]{
            String.valueOf(al.getId()),
            al.getCreatedAt() != null ? al.getCreatedAt().toString() : "",
            al.getAction() != null ? al.getAction() : "",
            al.getUsername() != null ? al.getUsername() : "",
            al.getDetails() != null ? al.getDetails() : ""
        }).toArray(String[][]::new);
        String[] headers = {"ID", "Timestamp", "Action Code", "Username", "Activity Description"};
        return buildResponse(format, "audit-logs", headers, data);
    }

    // ── Shared builder ───────────────────────────────────────────────────────
    private ResponseEntity<byte[]> buildResponse(String format, String name, String[] headers, String[][] rows) throws IOException {
        String date = LocalDate.now().toString();
        return switch (format.toLowerCase()) {
            case "excel", "xlsx" -> {
                byte[] bytes = toExcel(headers, rows);
                yield ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + name + "_" + date + ".xlsx")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(bytes);
            }
            case "pdf" -> {
                byte[] bytes = toPdfHtml(name, headers, rows).getBytes(StandardCharsets.UTF_8);
                yield ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=" + name + "_" + date + ".html")
                    .contentType(MediaType.TEXT_HTML)
                    .body(bytes);
            }
            default -> {
                byte[] bytes = toCsv(headers, rows).getBytes(StandardCharsets.UTF_8);
                yield ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + name + "_" + date + ".csv")
                    .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                    .body(bytes);
            }
        };
    }

    private String toCsv(String[] headers, String[][] rows) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.join(",", headers)).append("\n");
        for (String[] row : rows) {
            for (int i = 0; i < row.length; i++) {
                String v = row[i] != null ? row[i] : "";
                if (v.contains(",") || v.contains("\"") || v.contains("\n"))
                    v = "\"" + v.replace("\"", "\"\"") + "\"";
                sb.append(v);
                if (i < row.length - 1) sb.append(",");
            }
            sb.append("\n");
        }
        return sb.toString();
    }

    private byte[] toExcel(String[] headers, String[][] rows) throws IOException {
        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Sheet1");
            CellStyle headerStyle = wb.createCellStyle();
            Font font = wb.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }
            for (int r = 0; r < rows.length; r++) {
                Row row = sheet.createRow(r + 1);
                for (int c = 0; c < rows[r].length; c++) {
                    row.createCell(c).setCellValue(rows[r][c] != null ? rows[r][c] : "");
                }
            }
            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            wb.write(out);
            return out.toByteArray();
        }
    }

    private String toPdfHtml(String name, String[] headers, String[][] rows) {
        StringBuilder sb = new StringBuilder();
        sb.append("<html><head><title>").append(name).append("</title><style>")
          .append("body{font-family:Arial,sans-serif;font-size:11px;padding:20px}")
          .append("h2{color:#1e1b4b}table{width:100%;border-collapse:collapse}")
          .append("th{background:#7d2ae8;color:#fff;padding:6px 8px;text-align:left;font-size:10px;text-transform:uppercase}")
          .append("td{padding:5px 8px;border-bottom:1px solid #e2e8f0}")
          .append("tr:nth-child(even) td{background:#f8fafc}")
          .append("</style></head><body>")
          .append("<h2>").append(name.substring(0, 1).toUpperCase()).append(name.substring(1)).append(" Report</h2>")
          .append("<p style='color:#64748b;font-size:10px'>Generated: ").append(LocalDate.now()).append("</p>")
          .append("<table><thead><tr>");
        for (String h : headers) sb.append("<th>").append(h).append("</th>");
        sb.append("</tr></thead><tbody>");
        for (String[] row : rows) {
            sb.append("<tr>");
            for (String cell : row) sb.append("<td>").append(cell != null ? cell : "").append("</td>");
            sb.append("</tr>");
        }
        sb.append("</tbody></table><script>window.onload=function(){window.print()}</script></body></html>");
        return sb.toString();
    }
}
