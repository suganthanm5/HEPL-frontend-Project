@echo off
REM API Testing Script for Outlet Management System

echo.
echo ========================================
echo API Testing Script
echo ========================================
echo.

REM Test 1: Backend Health
echo [1/5] Testing Backend Health...
curl http://localhost:8080/api/health
echo.
echo.

REM Test 2: Database Connection
echo [2/5] Testing Database Connection...
mysql -h localhost -P 3307 -u root -p -e "USE oms; SELECT COUNT(*) as divisions FROM divisions WHERE is_deleted=false; SELECT COUNT(*) as products FROM products WHERE is_deleted=false; SELECT COUNT(*) as outlets FROM outlets WHERE is_deleted=false; SELECT COUNT(*) as locations FROM locations WHERE is_deleted=false;"
echo.
echo.

REM Test 3: Divisions Endpoint (without auth)
echo [3/5] Testing Divisions Endpoint (no auth)...
curl http://localhost:8080/api/divisions?page=0^&size=10
echo.
echo.

REM Test 4: Products Endpoint (without auth)
echo [4/5] Testing Products Endpoint (no auth)...
curl http://localhost:8080/api/products?page=0^&size=10
echo.
echo.

REM Test 5: Outlets Endpoint (without auth)
echo [5/5] Testing Outlets Endpoint (no auth)...
curl http://localhost:8080/api/outlets?page=0^&size=10
echo.
echo.

echo ========================================
echo Testing Complete
echo ========================================
echo.
echo If you see data in the responses above, the API is working.
echo If you see 401 errors, you need to login first and use the token.
echo If you see empty responses, check the database.
echo.
pause
