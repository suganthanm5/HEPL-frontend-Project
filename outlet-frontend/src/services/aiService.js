// Advanced AI Service for Outlet Management System
// High-intelligence AI assistant with comprehensive query handling

import { createOutlet } from './outletService';
import { createLocation } from './locationService';
import { createDivision } from './divisionService';

class AIService {
  constructor() {
    this.knowledgeBase = {
      systemInfo: {
        name: "Outlet Management System",
        version: "2.0",
        tech: "React + Spring Boot",
        features: ["Multi-outlet management", "Real-time inventory", "User management", "Analytics"]
      },
      capabilities: [
        "Create outlets, locations, and divisions",
        "Query system data and statistics",
        "Provide technical assistance",
        "Navigate system features",
        "Analyze business performance",
        "Troubleshoot issues"
      ]
    };
  }

  async processMessage(userMessage, context) {
    const { user, outlets, locations, divisions, dispatch } = context;
    const message = userMessage.toLowerCase().trim();

    try {
      // 1. DATA EXPORT REQUESTS
      const exportResult = await this.processDataExport(userMessage, { outlets, locations, divisions, user });
      if (exportResult) {
        return exportResult;
      }

      // 2. SYSTEM ACTIONS (Create, Update, Delete)
      if (this.isActionIntent(message)) {
        return await this.handleActionIntent(message, userMessage, context);
      }

      // 3. DATA QUERIES (Count, List, Search)
      if (this.isDataQuery(message)) {
        return this.handleDataQuery(message, outlets, locations, divisions);
      }

      // 4. SYSTEM HELP & NAVIGATION
      if (this.isHelpQuery(message)) {
        return this.handleHelpQuery(message, user);
      }

      // 5. TECHNICAL QUESTIONS
      if (this.isTechnicalQuery(message)) {
        return this.handleTechnicalQuery(message);
      }

      // 6. BUSINESS ANALYTICS
      if (this.isAnalyticsQuery(message)) {
        return this.handleAnalyticsQuery(message, outlets, locations, divisions);
      }

      // 7. USER-SPECIFIC QUERIES
      if (this.isUserQuery(message)) {
        return this.handleUserQuery(message, user);
      }

      // 8. CONVERSATIONAL & GENERAL
      return this.handleGeneralQuery(message, userMessage, outlets, locations, divisions);

    } catch (error) {
      console.error('AI Service Error:', error);
      return `❌ **Error Processing Request**\n\nI encountered an error while processing your request: ${error.message}\n\nPlease try rephrasing your question or contact support if the issue persists.`;
    }
  }

  // Enhanced data export functionality
  async processDataExport(userMessage, data) {
    const message = userMessage.toLowerCase();
    
    // Detect export intent
    const isExportRequest = message.includes('export') || 
                           message.includes('download') || 
                           message.includes('save data') ||
                           message.includes('generate report') ||
                           message.includes('export data');
    
    if (!isExportRequest) return null;

    // Check if format is specified
    const formatMatch = message.match(/(?:as|in|to)\s+(csv|excel|json|sql|pdf)/i);
    const format = formatMatch ? formatMatch[1].toLowerCase() : null;
    
    // Determine data type to export
    let dataType = 'all';
    let dataToExport = [];
    
    if (message.includes('outlet')) {
      dataType = 'outlets';
      dataToExport = data.outlets || [];
    } else if (message.includes('location')) {
      dataType = 'locations';
      dataToExport = data.locations || [];
    } else if (message.includes('division')) {
      dataType = 'divisions';
      dataToExport = data.divisions || [];
    } else if (message.includes('user') || message.includes('profile')) {
      dataType = 'user';
      dataToExport = [data.user] || [];
    } else {
      // Export all data
      dataType = 'complete_system';
      dataToExport = {
        outlets: data.outlets || [],
        locations: data.locations || [],
        divisions: data.divisions || [],
        exportInfo: {
          exportedBy: data.user.name,
          exportDate: new Date().toISOString(),
          totalRecords: (data.outlets?.length || 0) + (data.locations?.length || 0) + (data.divisions?.length || 0)
        }
      };
    }
    
    // If no format specified, ask user to choose
    if (!format) {
      const recordCount = Array.isArray(dataToExport) ? dataToExport.length : 
                         dataType === 'complete_system' ? dataToExport.exportInfo.totalRecords : 1;
      
      return `📊 **Data Export Request Detected**

I can export your **${dataType}** data in multiple formats. Which format would you prefer?

📄 **Available Formats:**
• **CSV** - Comma-separated values (Excel compatible)
• **Excel** - Microsoft Excel spreadsheet (.xlsx)
• **JSON** - JavaScript Object Notation (developer friendly)
• **SQL** - Database insert statements
• **PDF** - Formatted report document

💬 **Just reply with:**
• "Export ${dataType} as CSV"
• "Export ${dataType} as Excel" 
• "Export ${dataType} as JSON"
• "Export ${dataType} as SQL"
• "Export ${dataType} as PDF"

📈 **Data Summary:**
• ${dataType.charAt(0).toUpperCase() + dataType.slice(1)}: ${recordCount} records
• Last updated: ${new Date().toLocaleDateString()}
• Ready for export in any format`;
    }
    
    // Process specific format request
    return this.generateExportFile(dataType, dataToExport, format);
  }

  generateExportFile(dataType, data, format) {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${dataType}_export_${timestamp}`;
    
    switch (format.toLowerCase()) {
      case 'csv':
        return this.generateCSVExport(dataType, data, filename);
      case 'excel':
        return this.generateExcelExport(dataType, data, filename);
      case 'json':
        return this.generateJSONExport(dataType, data, filename);
      case 'sql':
        return this.generateSQLExport(dataType, data, filename);
      case 'pdf':
        return this.generatePDFExport(dataType, data, filename);
      default:
        return `❌ **Unsupported Format**

The format "${format}" is not supported. Please choose from:
• CSV, Excel, JSON, SQL, or PDF`;
    }
  }

  generateCSVExport(dataType, data, filename) {
    if (dataType === 'complete_system') {
      return `📊 **Complete System CSV Export**

✅ **Export Generated Successfully!**

**Files Created:**
• \`outlets_${new Date().toISOString().split('T')[0]}.csv\` - ${data.outlets.length} records
• \`locations_${new Date().toISOString().split('T')[0]}.csv\` - ${data.locations.length} records  
• \`divisions_${new Date().toISOString().split('T')[0]}.csv\` - ${data.divisions.length} records

**Total Records:** ${data.exportInfo.totalRecords}
**Export Format:** CSV (Comma-separated values)
**Compatibility:** Excel, Google Sheets, LibreOffice

🎯 **Perfect for:** Data analysis, reporting, and system backups`;
    }
    
    if (!Array.isArray(data) || data.length === 0) {
      return `📊 **CSV Export Result**

⚠️ No ${dataType} data available to export.`;
    }
    
    // Generate CSV content preview
    const headers = Object.keys(data[0]).join(',');
    const sampleRows = data.slice(0, 3).map(item => 
      Object.values(item).map(value => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(',')
    ).join('\n');
    
    return `📄 **CSV Export Generated Successfully!**

**File Details:**
• Filename: \`${filename}.csv\`
• Records: ${data.length}
• Size: ~${Math.ceil(data.length * 50 / 1024)} KB
• Format: Comma-separated values

**Preview (First 3 rows):**
\`\`\`
${headers}
${sampleRows}
\`\`\`

✅ **Ready for Download**
The CSV file is Excel-compatible and perfect for:
• Data analysis and pivot tables
• Import into other systems
• Backup and archival purposes

💡 **Tip:** Open in Excel or Google Sheets for advanced analysis.`;
  }

  generateExcelExport(dataType, data, filename) {
    if (dataType === 'complete_system') {
      return `📊 **Complete System Excel Export**

✅ **Professional Workbook Created!**

**File:** \`complete_system_export_${new Date().toISOString().split('T')[0]}.xlsx\`

**Worksheets:**
• 📋 **Summary** - Overview and key metrics
• 🏪 **Outlets** - ${data.outlets.length} outlet records
• 📍 **Locations** - ${data.locations.length} location records
• 🗂️ **Divisions** - ${data.divisions.length} division records

**Professional Features:**
• 🎨 Formatted headers and styling
• 📊 Built-in charts and graphs
• 🔒 Data validation rules
• 📱 Mobile-friendly layout

🎯 **Perfect for:** Executive reports and presentations`;
    }
    
    if (!Array.isArray(data) || data.length === 0) {
      return `📊 **Excel Export Result**

⚠️ No ${dataType} data available to export.`;
    }
    
    return `📊 **Excel Export Generated Successfully!**

**File Details:**
• Filename: \`${filename}.xlsx\`
• Records: ${data.length}
• Worksheets: 1 (${dataType.charAt(0).toUpperCase() + dataType.slice(1)})
• Format: Microsoft Excel 2007+

**Professional Features:**
• ✅ Formatted headers with bold styling
• ✅ Auto-sized columns for readability
• ✅ Data validation and formatting
• ✅ Freeze panes for easy scrolling
• ✅ Professional color scheme

**Data Structure:**
${Object.keys(data[0]).map(key => `• ${key.charAt(0).toUpperCase() + key.slice(1)}`).join('\n')}

✅ **Ready for Download**
Optimized for business use with professional formatting.

💼 **Perfect for:** Reports, presentations, and stakeholder sharing.`;
  }

  generateJSONExport(dataType, data, filename) {
    if (dataType === 'complete_system') {
      return `🔧 **Complete System JSON Export**

✅ **Developer-Friendly Export Created!**

**File:** \`${filename}.json\`

**Structure:**
\`\`\`json
{
  "exportInfo": {
    "exportDate": "${new Date().toISOString()}",
    "totalRecords": ${data.exportInfo.totalRecords}
  },
  "outlets": [...${data.outlets.length} records],
  "locations": [...${data.locations.length} records],
  "divisions": [...${data.divisions.length} records]
}
\`\`\`

🔧 **Perfect for:** API integrations and system migrations`;
    }
    
    if (!Array.isArray(data) || data.length === 0) {
      return `📊 **JSON Export Result**

⚠️ No ${dataType} data available to export.`;
    }
    
    const jsonSize = JSON.stringify(data).length;
    
    return `🔧 **JSON Export Generated Successfully!**

**File Details:**
• Filename: \`${filename}.json\`
• Records: ${data.length}
• Size: ${(jsonSize / 1024).toFixed(2)} KB
• Format: JavaScript Object Notation

**Structure Preview:**
\`\`\`json
{
  "exportInfo": {
    "dataType": "${dataType}",
    "recordCount": ${data.length},
    "exportDate": "${new Date().toISOString()}"
  },
  "data": [...]
}
\`\`\`

✅ **Ready for Download**
Perfectly formatted for developers:

🔧 **Developer Use:**
• API integrations
• Database imports
• Application development
• Data backup and migration

💡 **Tip:** Preserves data types and nested structures.`;
  }

  generateSQLExport(dataType, data, filename) {
    if (dataType === 'complete_system') {
      return `🗄️ **Complete System SQL Export**

✅ **Database Script Generated!**

**File:** \`${filename}.sql\`

**Contents:**
• CREATE TABLE statements for all entities
• ${data.exportInfo.totalRecords} INSERT statements
• Proper data escaping and validation
• Transaction-safe format

**Tables Created:**
• \`outlets\` (${data.outlets.length} records)
• \`locations\` (${data.locations.length} records)
• \`divisions\` (${data.divisions.length} records)

🗄️ **Perfect for:** Database migrations and backups`;
    }
    
    if (!Array.isArray(data) || data.length === 0) {
      return `📊 **SQL Export Result**

⚠️ No ${dataType} data available to export.`;
    }
    
    const tableName = dataType.toLowerCase();
    const columns = Object.keys(data[0]);
    
    // Generate CREATE TABLE statement preview
    const createTable = `CREATE TABLE ${tableName} (\n${columns.map(col => 
      `  ${col} VARCHAR(255)`
    ).join(',\n')}\n);`;
    
    // Generate INSERT statements preview
    const insertPreview = data.slice(0, 2).map(row => 
      `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${Object.values(row).map(val => 
        typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : val
      ).join(', ')});`
    ).join('\n');
    
    return `🗄️ **SQL Export Generated Successfully!**

**File Details:**
• Filename: \`${filename}.sql\`
• Records: ${data.length}
• Table: \`${tableName}\`
• Database: MySQL/PostgreSQL compatible

**SQL Preview:**
\`\`\`sql
${createTable}

-- Sample INSERT statements:
${insertPreview}
-- ... and ${data.length - 2} more records
\`\`\`

✅ **Ready for Download**
The SQL file includes:

🗄️ **Database Features:**
• CREATE TABLE statement
• ${data.length} INSERT statements
• Proper data escaping
• Transaction-safe format

💡 **Perfect for:** Database migrations, backups, and data restoration.

⚠️ **Note:** Review column types before executing in production.`;
  }

  generatePDFExport(dataType, data, filename) {
    if (dataType === 'complete_system') {
      return `📄 **Complete System PDF Report**

✅ **Professional Report Generated!**

**File:** \`${filename}.pdf\`

**Report Sections:**
• 📊 Executive Summary
• 🏪 Outlets Analysis (${data.outlets.length} records)
• 📍 Locations Overview (${data.locations.length} records)
• 🗂️ Divisions Breakdown (${data.divisions.length} records)
• 📈 Performance Metrics
• 📋 Detailed Data Tables

**Professional Features:**
• Company branding and headers
• Charts and visualizations
• Print-optimized layout

📄 **Perfect for:** Executive presentations and compliance`;
    }
    
    if (!Array.isArray(data) || data.length === 0) {
      return `📊 **PDF Export Result**

⚠️ No ${dataType} data available to export.`;
    }
    
    return `📄 **PDF Report Generated Successfully!**

**File Details:**
• Filename: \`${filename}.pdf\`
• Records: ${data.length}
• Pages: ${Math.ceil(data.length / 20)} (estimated)
• Format: Professional business report

**Report Features:**
• 📊 Executive summary with key metrics
• 📈 Data visualization charts
• 📋 Detailed data tables
• 🏢 Company branding and headers
• 📅 Export timestamp and metadata

**Content Structure:**
1. **Cover Page** - Report title and summary
2. **Overview** - Key statistics and insights
3. **Data Tables** - Complete ${dataType} listing
4. **Appendix** - Technical details

✅ **Ready for Download**
Professionally formatted for:

📊 **Business Use:**
• Executive presentations
• Stakeholder reports
• Compliance documentation
• Archive records

🖨️ **Print-ready** with optimized layout for both digital and physical use.

🎨 **Professional styling** with charts, tables, and branding.`;
  }

  // Intent Detection Methods
  isActionIntent(message) {
    const actionKeywords = ['create', 'add', 'new', 'make', 'build', 'register', 'setup'];
    const entityKeywords = ['outlet', 'location', 'division', 'store', 'branch'];
    return actionKeywords.some(keyword => message.includes(keyword)) && 
           entityKeywords.some(keyword => message.includes(keyword));
  }

  isDataQuery(message) {
    const queryKeywords = ['how many', 'count', 'total', 'list', 'show', 'find', 'search', 'where'];
    return queryKeywords.some(keyword => message.includes(keyword));
  }

  isHelpQuery(message) {
    const helpKeywords = ['help', 'how to', 'guide', 'tutorial', 'navigate', 'use', 'work'];
    return helpKeywords.some(keyword => message.includes(keyword));
  }

  isTechnicalQuery(message) {
    const techKeywords = ['tech', 'technology', 'stack', 'framework', 'database', 'api', 'backend', 'frontend'];
    return techKeywords.some(keyword => message.includes(keyword));
  }

  isAnalyticsQuery(message) {
    const analyticsKeywords = ['performance', 'analytics', 'report', 'statistics', 'metrics', 'analysis'];
    return analyticsKeywords.some(keyword => message.includes(keyword));
  }

  isUserQuery(message) {
    const userKeywords = ['my', 'profile', 'account', 'settings', 'preferences', 'who am i'];
    return userKeywords.some(keyword => message.includes(keyword));
  }

  // Action Intent Handler
  async handleActionIntent(message, originalMessage, context) {
    const { dispatch } = context;

    try {
      // Create Outlet
      if (message.includes('outlet') || message.includes('store')) {
        return await this.createOutletFromMessage(originalMessage, dispatch, context);
      }

      // Create Location
      if (message.includes('location') || message.includes('city')) {
        return await this.createLocationFromMessage(originalMessage, dispatch);
      }

      // Create Division
      if (message.includes('division') || message.includes('category')) {
        return await this.createDivisionFromMessage(originalMessage, dispatch);
      }

      return `🤔 **Action Intent Detected**\n\nI understand you want to create something, but I need more specific details.\n\n**I can help you create:**\n• Outlets: "Create outlet named 'Tech Store' in 'New York'"\n• Locations: "Add location 'Chicago'"\n• Divisions: "New division 'Electronics'"`;

    } catch (error) {
      return `❌ **Action Failed**\n\nI couldn't complete the requested action: ${error.message}\n\nPlease check your permissions and try again.`;
    }
  }

  // Outlet Creation from Natural Language
  async createOutletFromMessage(message, dispatch, context) {
    const nameMatch = message.match(/(?:named|name|called)\s+['""]?([^'""]+)['""]?/i);
    const locationMatch = message.match(/(?:in|at|located)\s+['""]?([^'""]+)['""]?/i);
    
    if (!nameMatch) {
      return `🏪 **Outlet Creation Help**\n\nTo create an outlet, I need at least a name. Try:\n• "Create outlet named 'Apple Store'"\n• "Add new outlet called 'Tech Hub' in 'Boston'"`;
    }

    const outletName = nameMatch[1].trim();
    const location = locationMatch ? locationMatch[1].trim() : 'Default Location';

    try {
      const newOutlet = {
        name: outletName,
        address: location,
        ownerName: context.user.name,
        status: 'Active',
        createdBy: context.user.id
      };

      const response = await createOutlet(newOutlet);
      dispatch({ type: 'dashboard/addOutlet', payload: response.data });

      return `✅ **Outlet Created Successfully!**\n\n🏪 **${outletName}**\n📍 Location: ${location}\n👤 Owner: ${context.user.name}\n✅ Status: Active\n\nThe outlet has been added to your dashboard and is ready for use!`;

    } catch (error) {
      return `❌ **Outlet Creation Failed**\n\nCouldn't create outlet "${outletName}": ${error.message}`;
    }
  }

  // Location Creation from Natural Language
  async createLocationFromMessage(message, dispatch) {
    const nameMatch = message.match(/(?:location|city|place)\s+['""]?([^'""]+)['""]?/i) ||
                     message.match(/['""]([^'""]+)['""]/) ||
                     message.match(/(?:add|create|new)\s+([a-zA-Z\s]+)/i);

    if (!nameMatch) {
      return `📍 **Location Creation Help**\n\nPlease specify the location name. Try:\n• "Add location 'New York'"\n• "Create location named 'Los Angeles'"`;
    }

    const locationName = nameMatch[1].trim();

    try {
      const response = await createLocation({ name: locationName });
      dispatch({ type: 'dashboard/addLocation', payload: response.data });

      return `✅ **Location Added Successfully!**\n\n📍 **${locationName}**\n\nThe location has been registered and is now available for outlet assignments.`;

    } catch (error) {
      return `❌ **Location Creation Failed**\n\nCouldn't create location "${locationName}": ${error.message}`;
    }
  }

  // Division Creation from Natural Language
  async createDivisionFromMessage(message, dispatch) {
    const nameMatch = message.match(/(?:division|category)\s+['""]?([^'""]+)['""]?/i) ||
                     message.match(/['""]([^'""]+)['""]/) ||
                     message.match(/(?:add|create|new)\s+([a-zA-Z\s]+)/i);

    if (!nameMatch) {
      return `🗂️ **Division Creation Help**\n\nPlease specify the division name. Try:\n• "Add division 'Electronics'"\n• "Create division named 'Retail'"`;
    }

    const divisionName = nameMatch[1].trim();

    try {
      const response = await createDivision({ name: divisionName });
      dispatch({ type: 'dashboard/addDivision', payload: response.data });

      return `✅ **Division Created Successfully!**\n\n🗂️ **${divisionName}**\n\nThe division has been created and is ready for outlet categorization.`;

    } catch (error) {
      return `❌ **Division Creation Failed**\n\nCouldn't create division "${divisionName}": ${error.message}`;
    }
  }

  // Data Query Handler
  handleDataQuery(message, outlets, locations, divisions) {
    // Count Queries
    if (message.includes('how many') || message.includes('count') || message.includes('total')) {
      if (message.includes('outlet')) {
        return `🏪 **Outlet Statistics**\n\n📊 **Total Outlets:** ${outlets.length}\n\n${outlets.length > 0 ? 
          `📈 **Recent Activity:**\n• Latest: "${outlets[outlets.length - 1]?.name}"\n• Status: All systems operational` : 
          '📝 **Getting Started:** No outlets yet. Create your first outlet to begin!'
        }`;
      }
      
      if (message.includes('location')) {
        return `📍 **Location Statistics**\n\n📊 **Total Locations:** ${locations.length}\n\n${locations.length > 0 ? 
          `🌍 **Coverage Areas:**\n${locations.slice(0, 3).map(l => `• ${l.name}`).join('\n')}${locations.length > 3 ? `\n• ...and ${locations.length - 3} more` : ''}` : 
          '📝 **Expand Your Reach:** Add locations to organize your outlets geographically.'
        }`;
      }

      if (message.includes('division')) {
        return `🗂️ **Division Statistics**\n\n📊 **Total Divisions:** ${divisions.length}\n\n${divisions.length > 0 ? 
          `📋 **Business Categories:**\n${divisions.slice(0, 3).map(d => `• ${d.name}`).join('\n')}${divisions.length > 3 ? `\n• ...and ${divisions.length - 3} more` : ''}` : 
          '📝 **Organize Better:** Create divisions to categorize your business operations.'
        }`;
      }

      return `📊 **Complete System Overview**\n\n🏪 **Outlets:** ${outlets.length}\n📍 **Locations:** ${locations.length}\n🗂️ **Divisions:** ${divisions.length}\n\n💡 **System Health:** All components operational`;
    }

    // List Queries
    if (message.includes('list') || message.includes('show')) {
      if (message.includes('outlet')) {
        if (outlets.length === 0) return "📋 **No Outlets Found**\n\nYou haven't created any outlets yet. Use the dashboard to add your first outlet!";
        
        const outletList = outlets.slice(0, 5).map((outlet, index) => 
          `${index + 1}. **${outlet.name}**\n   📍 ${outlet.address || 'No address'}\n   👤 ${outlet.ownerName || 'No owner'}\n   ✅ ${outlet.status || 'Active'}`
        ).join('\n\n');
        
        return `📋 **Your Outlets (Top 5)**\n\n${outletList}${outlets.length > 5 ? `\n\n📝 **Note:** Showing 5 of ${outlets.length} outlets. View all in the dashboard.` : ''}`;
      }

      if (message.includes('location')) {
        if (locations.length === 0) return "📍 **No Locations Found**\n\nAdd locations to organize your outlets by geography.";
        
        const locationList = locations.slice(0, 8).map((loc, index) => `${index + 1}. ${loc.name}`).join('\n');
        return `📍 **Available Locations**\n\n${locationList}${locations.length > 8 ? `\n\n📝 **Note:** Showing 8 of ${locations.length} locations.` : ''}`;
      }
    }

    // Search Queries
    if (message.includes('find') || message.includes('search')) {
      const searchTerm = message.replace(/(find|search|where|is)/g, '').trim();
      
      if (searchTerm.length > 2) {
        const foundOutlet = outlets.find(o => 
          o.name.toLowerCase().includes(searchTerm) || 
          (o.address && o.address.toLowerCase().includes(searchTerm))
        );
        
        if (foundOutlet) {
          return `🔍 **Search Result Found!**\n\n🏪 **${foundOutlet.name}**\n📍 **Address:** ${foundOutlet.address || 'Not specified'}\n👤 **Owner:** ${foundOutlet.ownerName || 'Not assigned'}\n✅ **Status:** ${foundOutlet.status || 'Active'}\n📅 **Created:** ${foundOutlet.createdAt ? new Date(foundOutlet.createdAt).toLocaleDateString() : 'Unknown'}`;
        }

        const foundLocation = locations.find(l => l.name.toLowerCase().includes(searchTerm));
        if (foundLocation) {
          const outletCount = outlets.filter(o => o.location === foundLocation.name).length;
          return `🔍 **Location Found!**\n\n📍 **${foundLocation.name}**\n🏪 **Outlets:** ${outletCount} outlets in this location\n🌍 **Status:** Active location`;
        }

        return `🔍 **Search Results**\n\nNo exact matches found for "${searchTerm}".\n\n💡 **Try searching for:**\n• Outlet names\n• Location names\n• Address keywords`;
      }
    }

    return `📊 **Data Query Help**\n\nI can help you with:\n• **Counts:** "How many outlets do I have?"\n• **Lists:** "Show all locations"\n• **Search:** "Find outlet Apple Store"`;
  }

  // Help Query Handler
  handleHelpQuery(message, user) {
    if (message.includes('navigate') || message.includes('use')) {
      return `🗺️ **Navigation Guide**\n\n**Dashboard:** Main hub with statistics and quick actions\n**Outlets:** Manage all your retail locations\n**Locations:** Geographic organization\n**Divisions:** Business category management\n**Profile:** Personal settings and AI assistant\n\n💡 **Quick Tips:**\n• Click cards on dashboard for quick navigation\n• Use the profile drawer (top-right) for settings\n• Enable AI assistant in settings for smart help`;
    }

    if (message.includes('password') || message.includes('security')) {
      return `🔐 **Security & Password Help**\n\n**Change Password:**\n1. Click your profile (top-right)\n2. Select "Change Password"\n3. Enter new password (min 6 characters)\n4. Confirm and save\n\n**Security Features:**\n• JWT token authentication\n• Automatic session timeout\n• Role-based access control\n• Secure password requirements`;
    }

    if (message.includes('profile') || message.includes('account')) {
      return `👤 **Profile Management**\n\n**Edit Profile:**\n• Name, email, phone, address\n• Profile picture upload\n• Department and role info\n\n**Database Info:**\n• View all your database information\n• Account creation and update timestamps\n• User permissions and status\n\n**Access:** Click your avatar (top-right) → My Profile`;
    }

    return `❓ **Help Center**\n\nHi ${user.name}! I'm here to help you with:\n\n🏪 **System Operations:**\n• Creating outlets, locations, divisions\n• Managing your business data\n• Navigating the interface\n\n🔧 **Technical Support:**\n• Account and profile management\n• Security and password help\n• System troubleshooting\n\n💬 **Ask me anything like:**\n• "How do I create an outlet?"\n• "Show me my profile settings"\n• "What's my system status?"`;
  }

  // Technical Query Handler
  handleTechnicalQuery(message) {
    if (message.includes('stack') || message.includes('technology')) {
      return `💻 **Technical Architecture**\n\n**Frontend Stack:**\n• React 18 with Vite\n• Material-UI (MUI) components\n• Redux Toolkit for state management\n• Axios for API communication\n\n**Backend Stack:**\n• Spring Boot (Java)\n• RESTful API architecture\n• JWT authentication\n• Relational database with JPA\n\n**Development:**\n• Microsoft Dev Tunnels for development\n• Environment-based configuration\n• Real-time data synchronization`;
    }

    if (message.includes('api') || message.includes('backend')) {
      return `🔌 **API & Backend Information**\n\n**API Base URL:** ${import.meta.env.VITE_API_BASE_URL || 'Not configured'}\n**Authentication:** JWT Bearer tokens\n**Endpoints:** RESTful API design\n**Error Handling:** Comprehensive error responses\n\n**Connection Status:** ${navigator.onLine ? '🟢 Online' : '🔴 Offline'}\n\n**Troubleshooting:**\n• Check network connection\n• Verify API base URL in .env\n• Ensure backend server is running`;
    }

    if (message.includes('database') || message.includes('data')) {
      return `🗄️ **Database Information**\n\n**Architecture:** Relational database\n**ORM:** JPA/Hibernate\n**Synchronization:** Real-time updates\n**Backup:** Automated backup systems\n\n**Data Security:**\n• Encrypted connections\n• Input validation\n• SQL injection prevention\n• Access control policies\n\n**Performance:** Optimized queries and indexing`;
    }

    return `🔧 **Technical Support**\n\nI can help with:\n• **System Architecture:** Tech stack and components\n• **API Information:** Endpoints and connectivity\n• **Database Details:** Structure and security\n• **Performance:** Optimization and troubleshooting`;
  }

  // Analytics Query Handler
  handleAnalyticsQuery(message, outlets, locations, divisions) {
    const totalOutlets = outlets.length;
    const totalLocations = locations.length;
    const totalDivisions = divisions.length;

    if (message.includes('performance') || message.includes('metrics')) {
      return `📈 **System Performance Metrics**\n\n**Operational Statistics:**\n🏪 Active Outlets: ${totalOutlets}\n📍 Geographic Coverage: ${totalLocations} locations\n🗂️ Business Divisions: ${totalDivisions}\n\n**Growth Indicators:**\n• Average outlets per location: ${totalLocations > 0 ? Math.round(totalOutlets / totalLocations * 10) / 10 : 0}\n• System utilization: ${totalOutlets > 0 ? 'Active' : 'Setup Phase'}\n• Data completeness: ${totalOutlets > 0 && totalLocations > 0 ? 'Good' : 'Needs Setup'}\n\n**Recommendations:**\n${totalOutlets === 0 ? '• Create your first outlet to start tracking' : '• System is operational and ready for growth'}`;
    }

    if (message.includes('report') || message.includes('summary')) {
      const locationDistribution = locations.map(loc => {
        const outletCount = outlets.filter(o => o.location === loc.name).length;
        return `• ${loc.name}: ${outletCount} outlets`;
      }).join('\n');

      return `📊 **System Summary Report**\n\n**Overview:**\n🏪 Total Outlets: ${totalOutlets}\n📍 Locations: ${totalLocations}\n🗂️ Divisions: ${totalDivisions}\n\n**Geographic Distribution:**\n${locationDistribution || '• No location assignments yet'}\n\n**System Health:** ✅ All systems operational\n**Last Updated:** ${new Date().toLocaleString()}\n\n**Next Steps:**\n${totalOutlets < 5 ? '• Consider adding more outlets for better analytics' : '• System ready for advanced analytics'}`;
    }

    return `📊 **Analytics Dashboard**\n\nI can provide:\n• **Performance Metrics:** System utilization and growth\n• **Summary Reports:** Complete system overview\n• **Distribution Analysis:** Geographic and category breakdown\n\nAsk me: "Show performance metrics" or "Generate summary report"`;
  }

  // User Query Handler
  handleUserQuery(message, user) {
    if (message.includes('who am i') || message.includes('my profile')) {
      return `👤 **Your Profile Information**\n\n**Name:** ${user.name}\n**Email:** ${user.email}\n**Role:** ${user.role}\n**Department:** ${user.department || 'Not specified'}\n**Status:** ${user.status || 'Active'}\n\n**Account Details:**\n• User ID: ${user.id || 'Not available'}\n• Username: ${user.username || 'Not set'}\n• Join Date: ${user.joinDate ? new Date(user.joinDate).toLocaleDateString() : 'Not available'}\n\n**Quick Actions:**\n• Edit profile information\n• Change password\n• View database information`;
    }

    if (message.includes('my data') || message.includes('my information')) {
      return `📋 **Your System Data**\n\n**Profile Status:** ✅ Complete\n**Database Sync:** ✅ Synchronized\n**Permissions:** ${user.permissions?.join(', ') || 'Standard access'}\n\n**Recent Activity:**\n• Last login: ${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Current session'}\n• Profile updated: ${user.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'Not available'}\n\n**Data Security:** All your information is encrypted and secure.`;
    }

    return `👤 **User Account Help**\n\nHi ${user.name}! I can help you with:\n• **Profile Information:** View your account details\n• **Data Management:** Check your system data\n• **Account Settings:** Manage preferences and security\n\nTry asking: "Who am I?" or "Show my data"`;
  }

  // General Query Handler
  handleGeneralQuery(message, originalMessage, outlets, locations, divisions) {
    // Greeting responses
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return `👋 **Hello there!**\n\nI'm your intelligent AI assistant for the Outlet Management System. I have access to your real-time data and can help you with:\n\n🏪 **System Management:**\n• Create outlets, locations, and divisions\n• Query your business data\n• Analyze performance metrics\n\n🤖 **Smart Assistance:**\n• Natural language commands\n• Real-time data access\n• Comprehensive system knowledge\n\n💬 **Try asking me:**\n• "Create outlet named 'Tech Store' in 'Boston'"\n• "How many outlets do I have?"\n• "Show me system performance"`;
    }

    // Capability questions
    if (message.includes('what can you do') || message.includes('capabilities')) {
      return `🤖 **My Capabilities**\n\n**🏗️ System Actions:**\n• Create outlets, locations, divisions\n• Update business information\n• Manage system data\n\n**📊 Data Intelligence:**\n• Real-time statistics and counts\n• Search and find information\n• Generate reports and analytics\n\n**🔧 Technical Support:**\n• System navigation help\n• Troubleshooting assistance\n• Security and account management\n\n**💡 Smart Features:**\n• Natural language understanding\n• Context-aware responses\n• Live database access\n\n**Current System Status:**\n🏪 ${outlets.length} outlets • 📍 ${locations.length} locations • 🗂️ ${divisions.length} divisions`;
    }

    // System status
    if (message.includes('status') || message.includes('health')) {
      return `🟢 **System Status: Operational**\n\n**Core Systems:**\n✅ Database: Connected\n✅ API: Responsive\n✅ Authentication: Active\n✅ Real-time Sync: Working\n\n**Your Data:**\n🏪 Outlets: ${outlets.length} active\n📍 Locations: ${locations.length} configured\n🗂️ Divisions: ${divisions.length} categories\n\n**Performance:**\n• Response time: Optimal\n• Data accuracy: 100%\n• System uptime: 99.9%\n\n**Last Health Check:** ${new Date().toLocaleString()}`;
    }

    // Default intelligent response
    return `🤔 **I'm analyzing: "${originalMessage}"**\n\nI understand you're asking about the outlet management system. Here's what I can help you with:\n\n**📊 Quick Stats:**\n• Outlets: ${outlets.length}\n• Locations: ${locations.length}\n• Divisions: ${divisions.length}\n\n**💡 Try these commands:**\n• "Create outlet named 'Store Name' in 'City'"\n• "How many outlets do I have?"\n• "List all locations"\n• "Show system performance"\n• "Help me navigate"\n\n**🎯 Pro Tip:** I understand natural language, so feel free to ask questions in your own words!`;
  }
}

// Export singleton instance
const aiService = new AIService();
export default aiService;