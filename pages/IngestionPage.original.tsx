'use client';

import { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import { useData } from '../components/DataProvider';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Download,
  Database,
  Settings,
  Table,
  Eye,
  Edit,
  Trash2,
  Filter,
  Search,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Wand2,
  Shield,
  BarChart3,
  RefreshCw,
  Save,
  Copy,
  MoreHorizontal,
  Columns,
  SortAsc,
  SortDesc,
  Calendar,
  DollarSign,
  Hash,
  Type,
  CheckSquare,
  Square,
  AlertTriangle,
  Info,
  Zap,
} from 'lucide-react';
import { useUnifiedData } from '../components/UnifiedDataProvider';
import WorkflowOrchestrator from '../components/WorkflowOrchestrator';
import { useIngestionJobs, useProjects } from '../hooks/useApi';
import { Project } from '../types';
import {
  validateData,
  analyzeDataQuality,
  inferColumnTypes,
  detectFileType,
} from '../utils/ingestion';
import {
  DataQualityPanel,
  ValidationResults,
  FileUploadZone,
  DataPreviewTable,
  FieldMappingEditor,
  DataTransformPanel,
} from '../components/ingestion';
import type {
  DataQualityMetrics,
  FieldMapping,
  DataValidation,
  ColumnValue,
  DataRow,
  ColumnInfo,
  EXIFData,
  VideoMetadata,
  ExtractedContent,
  ChatMessage,
  ContractAnalysis,
  UploadedFile,
  TableData,
  SortConfig,
  FilterConfig,
  PaginationConfig,
} from '../types/ingestion';

interface IngestionPageProps {
  project: Project;
}

const IngestionPage = ({ project }: IngestionPageProps) => {
  const { currentProject, addIngestionData, transformIngestionToReconciliation } = useData();
  const {
    crossPageData,
    updateCrossPageData,
    workflowProgress,
    advanceWorkflow,
    addNotification,
    validateCrossPageData,
  } = useUnifiedData();
  const { projects, fetchProjects, createProject } = useProjects();
  const {
    jobs,
    fetchJobs,
    uploadFile: uploadFileToAPI,
    processData: processDataWithAPI,
    isLoading: jobsLoading,
  } = useIngestionJobs();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Enhanced table state
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 1,
    pageSize: 50,
    totalRecords: 0,
  });
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ row: string; column: string } | null>(null);

  // Data processing state
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [showQualityReport, setShowQualityReport] = useState(false);
  const [showValidationReport, setShowValidationReport] = useState(false);
  const [isCleaningData, setIsCleaningData] = useState(false);
  const [cleaningProgress, setCleaningProgress] = useState(0);

  // Sync data to reconciliation when processing is complete
  const syncToReconciliation = async () => {
    if (!currentProject) return;

    try {
      // Transform ingestion data to reconciliation format
      const updatedProject = transformIngestionToReconciliation(currentProject.id);

      if (updatedProject) {
        console.log('Data synced to reconciliation:', updatedProject.reconciliationData);
        // You could add a success notification here
      }
    } catch (error) {
      console.error('Failed to sync data to reconciliation:', error);
    }
  };

  const standardizeDate = (dateStr: string): string => {
    try {
      // Handle various date formats
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return dateStr; // Return original if can't parse
      }
      return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    } catch {
      return dateStr;
    }
  };

  const cleanAndStandardizeData = useCallback(
    (data: DataRow[], fileType: string): DataRow[] => {
      return data.map((record, index) => {
        const cleanedRecord = { ...record };

        // Clean and standardize each field
        Object.keys(cleanedRecord).forEach((key) => {
          const value = cleanedRecord[key];

          if (typeof value === 'string') {
            // Remove extra whitespace
            cleanedRecord[key] = value.trim();

            // Standardize currency fields
            if (
              key.toLowerCase().includes('amount') ||
              key.toLowerCase().includes('price') ||
              key.toLowerCase().includes('cost')
            ) {
              cleanedRecord[key] = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
            }

            // Standardize date fields
            if (key.toLowerCase().includes('date')) {
              cleanedRecord[key] = standardizeDate(value);
            }

            // Standardize text fields
            if (key.toLowerCase().includes('description') || key.toLowerCase().includes('name')) {
              cleanedRecord[key] = value.toLowerCase().replace(/\s+/g, ' ');
            }
          }
        });

        return { ...cleanedRecord, id: `REC-${String(index + 1).padStart(6, '0')}` };
      });
    },
    [standardizeDate]
  );

  // Utility functions now imported from utils/ingestion
  // Removed duplicate definitions: validateData, analyzeDataQuality, inferColumnTypes, detectFileType

  // Enhanced table functionality
  const handleSort = (field: string) => {
    setSortConfig((prev) => ({
      field,
      direction: prev?.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleFilter = (
    field: string,
    operator: FilterConfig['operator'],
    value: ColumnValue,
    value2?: ColumnValue
  ) => {
    setFilters((prev) => {
      const existingFilter = prev.find((f) => f.field === field);
      if (existingFilter) {
        return prev.map((f) => (f.field === field ? { field, operator, value, value2 } : f));
      } else {
        return [...prev, { field, operator, value, value2 }];
      }
    });
  };

  const removeFilter = (field: string) => {
    setFilters((prev) => prev.filter((f) => f.field !== field));
  };

  const clearAllFilters = () => {
    setFilters([]);
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination((prev) => ({ ...prev, pageSize: newPageSize, page: 1 }));
  };

  const toggleRowSelection = (rowId: string) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  const toggleAllRowsSelection = () => {
    if (selectedRows.size === filteredData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredData.map((row) => row.id)));
    }
  };

  const toggleColumnVisibility = (columnName: string) => {
    setVisibleColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(columnName)) {
        newSet.delete(columnName);
      } else {
        newSet.add(columnName);
      }
      return newSet;
    });
  };

  // Process and filter data
  const processedData = useMemo(() => {
    if (!selectedFile?.data) return [];

    let data = [...selectedFile.data];

    // Apply filters
    filters.forEach((filter) => {
      data = data.filter((row) => {
        const value = row[filter.field];
        switch (filter.operator) {
          case 'equals':
            return value === filter.value;
          case 'contains':
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'startsWith':
            return String(value).toLowerCase().startsWith(String(filter.value).toLowerCase());
          case 'endsWith':
            return String(value).toLowerCase().endsWith(String(filter.value).toLowerCase());
          case 'greaterThan':
            return Number(value) > Number(filter.value);
          case 'lessThan':
            return Number(value) < Number(filter.value);
          case 'between':
            return Number(value) >= Number(filter.value) && Number(value) <= Number(filter.value2);
          default:
            return true;
        }
      });
    });

    // Apply sorting
    if (sortConfig) {
      data.sort((a, b) => {
        const aVal = a[sortConfig.field];
        const bVal = b[sortConfig.field];

        // Handle null values
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return sortConfig.direction === 'asc' ? -1 : 1;
        if (bVal == null) return sortConfig.direction === 'asc' ? 1 : -1;

        // At this point both are non-null
        const nonNullAVal = aVal as NonNullable<ColumnValue>;
        const nonNullBVal = bVal as NonNullable<ColumnValue>;

        if (nonNullAVal < nonNullBVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (nonNullAVal > nonNullBVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [selectedFile?.data, filters, sortConfig]);

  const filteredData = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return processedData.slice(startIndex, endIndex);
  }, [processedData, pagination]);

  const generateSampleData = (fileType: UploadedFile['fileType'], recordCount: number) => {
    if (fileType === 'expenses') {
      return Array.from({ length: recordCount }, (_, i) => ({
        id: `EXP-${String(i + 1).padStart(4, '0')}`,
        date: new Date(2023, 11, Math.floor(Math.random() * 30) + 1).toISOString().split('T')[0],
        description: [
          'Office Supplies',
          'Travel Expenses',
          'Software License',
          'Marketing',
          'Utilities',
        ][Math.floor(Math.random() * 5)],
        category: ['Administrative', 'Travel', 'Technology', 'Marketing', 'Operations'][
          Math.floor(Math.random() * 5)
        ],
        amount: (Math.random() * 5000 + 100).toFixed(2),
        vendor: ['Vendor A', 'Vendor B', 'Vendor C', 'Vendor D'][Math.floor(Math.random() * 4)],
        reference: `REF-${Math.floor(Math.random() * 10000)}`,
        status: ['Approved', 'Pending', 'Rejected'][Math.floor(Math.random() * 3)],
      }));
    } else if (fileType === 'bank_statement') {
      return Array.from({ length: recordCount }, (_, i) => ({
        id: `TXN-${String(i + 1).padStart(6, '0')}`,
        date: new Date(2023, 11, Math.floor(Math.random() * 30) + 1).toISOString().split('T')[0],
        description: ['Payment Received', 'Payment Sent', 'Transfer', 'Fee', 'Interest'][
          Math.floor(Math.random() * 5)
        ],
        type: ['Credit', 'Debit'][Math.floor(Math.random() * 2)],
        amount: (Math.random() * 10000 + 50).toFixed(2),
        balance: (Math.random() * 50000 + 10000).toFixed(2),
        reference: `TXN-${Math.floor(Math.random() * 100000)}`,
        account: `ACC-${Math.floor(Math.random() * 1000)}`,
      }));
    } else {
      return Array.from({ length: recordCount }, (_, i) => ({
        id: `REC-${String(i + 1).padStart(4, '0')}`,
        field1: `Value ${i + 1}`,
        field2: Math.floor(Math.random() * 1000),
        field3: ['Option A', 'Option B', 'Option C'][Math.floor(Math.random() * 3)],
        field4: new Date().toISOString().split('T')[0],
      }));
    }
  };

  const processFileContent = async (
    file: File,
    fileType: UploadedFile['fileType']
  ): Promise<Partial<UploadedFile>> => {
    try {
      const fileExtension = file.name.toLowerCase().split('.').pop();

      if (fileExtension === 'csv' || fileExtension === 'xlsx' || fileExtension === 'xls') {
        return await processStructuredFile(file, fileType);
      } else if (fileExtension === 'json') {
        return await processJSONFile(file, fileType);
      } else if (['pdf', 'docx', 'doc'].includes(fileExtension || '')) {
        return await processDocumentFile(file, fileType);
      } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '')) {
        return await processImageFile(file, fileType);
      } else if (['mp4', 'avi', 'mov', 'webm'].includes(fileExtension || '')) {
        return await processVideoFile(file, fileType);
      } else {
        // Fallback for unsupported files
        return {
          data: [],
          columns: [],
          qualityMetrics: {
            completeness: 0.5,
            accuracy: 0.5,
            consistency: 0.5,
            validity: 0.5,
            duplicates: 0,
            errors: 0.5,
          },
          validations: [
            {
              field: 'file',
              rule: 'File Type',
              passed: false,
              message: `Unsupported file type: ${fileExtension}`,
              severity: 'error',
            },
          ],
        };
      }
    } catch (error) {
      console.error('Error processing file:', error);
      return {
        data: [],
        columns: [],
        qualityMetrics: {
          completeness: 0,
          accuracy: 0,
          consistency: 0,
          validity: 0,
          duplicates: 0,
          errors: 1,
        },
        validations: [
          {
            field: 'file',
            rule: 'Processing Error',
            passed: false,
            message: `Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'error',
          },
        ],
      };
    }
  };

  const processStructuredFile = async (
    file: File,
    fileType: UploadedFile['fileType']
  ): Promise<Partial<UploadedFile>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      // Handle FileReader errors
      reader.onerror = (errorEvent) => {
        const error = errorEvent.target?.error || new Error('FileReader error');
        console.error('FileReader error:', error);
        resolve({
          data: [],
          columns: [],
          qualityMetrics: {
            completeness: 0,
            accuracy: 0,
            consistency: 0,
            validity: 0,
            duplicates: 0,
            errors: 1,
          },
          validations: [
            {
              field: 'file',
              rule: 'File Read Error',
              passed: false,
              message: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
              severity: 'error',
            },
          ],
        });
      };

      reader.onload = (e) => {
        try {
          // Validate file read result
          if (!e.target || !e.target.result) {
            throw new Error('FileReader result is null or undefined');
          }

          const text = e.target.result as string;
          
          // Validate text is not empty
          if (!text || text.trim().length === 0) {
            throw new Error('File is empty or contains no readable content');
          }

          let data: DataRow[] = [];
          const fileExtension = file.name.toLowerCase();

          if (fileExtension.endsWith('.csv')) {
            // CSV parsing with error handling
            try {
              const lines = text.split('\n').filter((line) => line.trim());
              
              if (lines.length === 0) {
                throw new Error('CSV file contains no data rows');
              }

              // Parse headers with proper error handling
              const headerLine = lines[0];
              if (!headerLine || headerLine.trim().length === 0) {
                throw new Error('CSV file missing header row');
              }

              const headers = headerLine.split(',').map((h) => h.trim().replace(/"/g, ''));
              
              if (headers.length === 0) {
                throw new Error('CSV file has no column headers');
              }

              // Parse data rows
              let rowErrors = 0;
              for (let i = 1; i < lines.length; i++) {
                try {
                  const line = lines[i];
                  if (!line || line.trim().length === 0) {
                    continue; // Skip empty lines
                  }

                  const values = line.split(',').map((v) => v.trim().replace(/"/g, ''));
                  
                  // Handle rows with mismatched column count
                  if (values.length !== headers.length) {
                    rowErrors++;
                    // Log warning but continue processing
                    if (rowErrors <= 5) { // Only log first 5 errors to avoid spam
                      console.warn(`CSV row ${i + 1} has ${values.length} columns, expected ${headers.length}. Skipping row.`);
                    }
                    continue;
                  }

                  const row: DataRow = {} as DataRow;
                  headers.forEach((header, index) => {
                    row[header] = values[index] || null;
                  });
                  data.push(row);
                } catch (rowError) {
                  rowErrors++;
                  console.warn(`Error parsing CSV row ${i + 1}:`, rowError);
                  // Continue processing other rows
                }
              }

              if (data.length === 0 && rowErrors > 0) {
                throw new Error(`Failed to parse any CSV rows. ${rowErrors} row(s) had errors.`);
              }

              if (rowErrors > 0 && data.length > 0) {
                console.warn(`Successfully parsed ${data.length} rows, but ${rowErrors} row(s) had errors and were skipped.`);
              }
            } catch (csvError) {
              throw new Error(`CSV parsing failed: ${csvError instanceof Error ? csvError.message : String(csvError)}`);
            }
          } else if (fileExtension.endsWith('.json')) {
            // JSON parsing with proper error handling
            try {
              const parsed = JSON.parse(text);
              
              // Validate parsed data structure
              if (parsed === null || parsed === undefined) {
                throw new Error('JSON file contains null or undefined');
              }

              if (Array.isArray(parsed)) {
                data = parsed;
              } else if (typeof parsed === 'object') {
                // Wrap single object in array
                data = [parsed];
              } else {
                throw new Error('JSON file does not contain an object or array');
              }

              // Validate data array contains valid objects
              if (data.length === 0) {
                throw new Error('JSON array is empty');
              }

              // Validate each item is an object
              const invalidItems = data.filter((item) => typeof item !== 'object' || item === null || Array.isArray(item));
              if (invalidItems.length > 0) {
                console.warn(`JSON file contains ${invalidItems.length} invalid items (not objects). They will be skipped.`);
                data = data.filter((item) => typeof item === 'object' && item !== null && !Array.isArray(item));
              }

              if (data.length === 0) {
                throw new Error('JSON file contains no valid data objects');
              }
            } catch (jsonError) {
              if (jsonError instanceof SyntaxError) {
                throw new Error(`Invalid JSON syntax: ${jsonError.message}`);
              }
              throw new Error(`JSON parsing failed: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
            }
          } else {
            throw new Error(`Unsupported file type: ${fileExtension}. Only .csv and .json files are supported.`);
          }

          // Process data with error handling
          let cleanedData: DataRow[] = [];
          let columns: unknown[] = [];
          let qualityMetrics = {
            completeness: 0,
            accuracy: 0,
            consistency: 0,
            validity: 0,
            duplicates: 0,
            errors: 0,
          };
          let validations: unknown[] = [];

          try {
            cleanedData = cleanAndStandardizeData(data, fileType);
            columns = inferColumnTypes(cleanedData);
            qualityMetrics = analyzeDataQuality(cleanedData);
            validations = validateData(cleanedData, fileType);
          } catch (processError) {
            console.error('Error processing file data:', processError);
            // Return partial results with error information
            resolve({
              data: data, // Return raw data if processing fails
              columns: [],
              qualityMetrics: {
                completeness: 0,
                accuracy: 0,
                consistency: 0,
                validity: 0,
                duplicates: 0,
                errors: 1,
              },
              validations: [
                {
                  field: 'file',
                  rule: 'Data Processing Error',
                  passed: false,
                  message: `Failed to process file data: ${processError instanceof Error ? processError.message : 'Unknown error'}`,
                  severity: 'error',
                },
              ],
            });
            return;
          }

          resolve({
            data: cleanedData,
            columns,
            qualityMetrics,
            validations,
          });
        } catch (error) {
          // Comprehensive error handling
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('File processing error:', error);
          
          resolve({
            data: [],
            columns: [],
            qualityMetrics: {
              completeness: 0,
              accuracy: 0,
              consistency: 0,
              validity: 0,
              duplicates: 0,
              errors: 1,
            },
            validations: [
              {
                field: 'file',
                rule: 'Parse Error',
                passed: false,
                message: `Failed to parse file: ${errorMessage}`,
                severity: 'error',
              },
            ],
          });
        }
      };
      
      // Start reading file
      try {
        reader.readAsText(file);
      } catch (readError) {
        console.error('Error starting file read:', readError);
        resolve({
          data: [],
          columns: [],
          qualityMetrics: {
            completeness: 0,
            accuracy: 0,
            consistency: 0,
            validity: 0,
            duplicates: 0,
            errors: 1,
          },
          validations: [
            {
              field: 'file',
              rule: 'File Read Error',
              passed: false,
              message: `Failed to start reading file: ${readError instanceof Error ? readError.message : 'Unknown error'}`,
              severity: 'error',
            },
          ],
        });
      }
    });
  };

  const processJSONFile = async (
    file: File,
    fileType: UploadedFile['fileType']
  ): Promise<Partial<UploadedFile>> => {
    return processStructuredFile(file, fileType);
  };

  const processDocumentFile = async (
    file: File,
    fileType: UploadedFile['fileType']
  ): Promise<Partial<UploadedFile>> => {
    // Simulate document processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return {
      extractedContent: {
        text: 'Sample extracted text from document. This would contain the full text content extracted from the document.',
        metadata: {
          pages: 5,
          author: 'Document Author',
          title: file.name,
          creationDate: new Date().toISOString(),
        },
        entities: [
          { type: 'PERSON', value: 'John Doe', confidence: 0.85 },
          { type: 'ORGANIZATION', value: 'Sample Corp', confidence: 0.8 },
        ],
        summary: 'Document summary would be generated here.',
        keyTerms: ['document', 'content', 'analysis'],
        sentiment: 'neutral',
        language: 'en',
        pages: 5,
        fileSize: file.size,
        creationDate: new Date().toISOString(),
        mimeType: file.type,
        checksum: 'placeholder-checksum',
      },
      qualityMetrics: {
        completeness: 0.8,
        accuracy: 0.9,
        consistency: 0.85,
        validity: 0.9,
        duplicates: 0,
        errors: 0.1,
      },
      validations: [],
    };
  };

  const processImageFile = async (
    file: File,
    fileType: UploadedFile['fileType']
  ): Promise<Partial<UploadedFile>> => {
    try {
      // Create preview URL
      const previewUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      const extractedContent = await extractImageContent(file);

      return {
        extractedContent,
        previewUrl,
        qualityMetrics: {
          completeness: 0.9,
          accuracy: 0.95,
          consistency: 0.9,
          validity: 0.95,
          duplicates: 0,
          errors: 0.05,
        },
        validations: [],
      };
    } catch (error) {
      // Fallback with basic preview
      let previewUrl: string | undefined;
      try {
        previewUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
      } catch {
        // Ignore preview error
      }

      return {
        previewUrl,
        qualityMetrics: {
          completeness: 0.5,
          accuracy: 0.5,
          consistency: 0.5,
          validity: 0.5,
          duplicates: 0,
          errors: 0.5,
        },
        validations: [
          {
            field: 'image',
            rule: 'Processing Error',
            passed: false,
            message: 'Failed to extract image content',
            severity: 'error' as const,
          },
        ],
      };
    }
  };

  const processVideoFile = async (
    file: File,
    fileType: UploadedFile['fileType']
  ): Promise<Partial<UploadedFile>> => {
    try {
      const extractedContent = await extractVideoContent(file);
      return {
        extractedContent,
        previewUrl: URL.createObjectURL(file),
        qualityMetrics: {
          completeness: 0.85,
          accuracy: 0.9,
          consistency: 0.85,
          validity: 0.9,
          duplicates: 0,
          errors: 0.1,
        },
        validations: [],
      };
    } catch (error) {
      return {
        previewUrl: URL.createObjectURL(file),
        qualityMetrics: {
          completeness: 0.5,
          accuracy: 0.5,
          consistency: 0.5,
          validity: 0.5,
          duplicates: 0,
          errors: 0.5,
        },
        validations: [
          {
            field: 'video',
            rule: 'Processing Error',
            passed: false,
            message: 'Failed to extract video content',
            severity: 'error' as const,
          },
        ],
      };
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newFiles: UploadedFile[] = acceptedFiles.map((file) => {
        const fileType = detectFileType(file.name, file.type);
        return {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'uploading',
          progress: 0,
          fileType: fileType,
          file: file,
        };
      });

      setUploadedFiles((prev) => [...prev, ...newFiles]);

      // Process each file with AI extraction
      newFiles.forEach(async (file) => {
        const interval = setInterval(() => {
          setUploadedFiles((prev) =>
            prev.map((f) => {
              if (f.id === file.id) {
                const newProgress = Math.min(f.progress + Math.random() * 15, 100);
                const isCompleted = newProgress >= 100;

                if (isCompleted) {
                  clearInterval(interval);

                  // Process file content based on type
                  processFileContent(
                    acceptedFiles.find((f) => f.name === file.name)!,
                    file.fileType
                  ).then((content) => {
                    let processedData: DataRow[] = [];
                    let columns: ColumnInfo[] = [];
                    let qualityMetrics: DataQualityMetrics | undefined;

                    // Handle structured data files
                    if (['expenses', 'bank_statement', 'other'].includes(file.fileType)) {
                      const recordCount = Math.floor(Math.random() * 5000) + 500;
                      const sampleData = generateSampleData(file.fileType, recordCount);
                      processedData = cleanAndStandardizeData(sampleData, file.fileType);
                      columns = inferColumnTypes(processedData);
                      qualityMetrics = analyzeDataQuality(processedData);
                      const validations = validateData(processedData, file.fileType);
                      content.validations = validations;
                    }

                    setUploadedFiles((prev) =>
                      prev.map((f) =>
                        f.id === file.id
                          ? {
                              ...f,
                              progress: newProgress,
                              status: 'completed',
                              records: processedData.length || f.chatMessages?.length || 1,
                              data: processedData,
                              columns: columns,
                              qualityMetrics: qualityMetrics,
                              ...content,
                            }
                          : f
                      )
                    );
                  });

                  return {
                    ...f,
                    progress: newProgress,
                    status: 'extracting',
                  };
                }

                return {
                  ...f,
                  progress: newProgress,
                  status: f.progress > 50 ? 'analyzing' : 'uploading',
                };
              }
              return f;
            })
          );
        }, 300);
      });
    },
    [cleanAndStandardizeData, processFileContent]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      // Structured data files
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/json': ['.json'],
      'text/plain': ['.txt'],

      // Document files
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],

      // Image files
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/bmp': ['.bmp'],
      'image/tiff': ['.tiff', '.tif'],
      'image/webp': ['.webp'],

      // Video files
      'video/mp4': ['.mp4'],
      'video/avi': ['.avi'],
      'video/quicktime': ['.mov'],
      'video/x-msvideo': ['.wmv'],
      'video/webm': ['.webm'],
      'video/x-matroska': ['.mkv'],

      // Audio files
      'audio/mpeg': ['.mp3'],
      'audio/wav': ['.wav'],
      'audio/flac': ['.flac'],
      'audio/aac': ['.aac'],
      'audio/ogg': ['.ogg'],
      'audio/mp4': ['.m4a'],

      // Chat history files
    },
    multiple: true,
  });

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
    if (selectedFile?.id === fileId) {
      setSelectedFile(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeColor = (fileType: string) => {
    switch (fileType) {
      case 'expenses':
        return 'bg-green-100 text-green-800';
      case 'bank_statement':
        return 'bg-blue-100 text-blue-800';
      case 'chat_history':
        return 'bg-purple-100 text-purple-800';
      case 'pdf_document':
        return 'bg-red-100 text-red-800';
      case 'image':
        return 'bg-pink-100 text-pink-800';
      case 'video':
        return 'bg-orange-100 text-orange-800';
      case 'audio':
        return 'bg-yellow-100 text-yellow-800';
      case 'contract':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'expenses':
        return '💰';
      case 'bank_statement':
        return '🏦';
      case 'chat_history':
        return '💬';
      case 'pdf_document':
        return '📄';
      case 'image':
        return '🖼️';
      case 'video':
        return '🎥';
      case 'audio':
        return '🎵';
      case 'contract':
        return '📋';
      default:
        return '📁';
    }
  };

  const filteredFiles = uploadedFiles.filter((file) => {
    const matchesType = filterType === 'all' || file.fileType === filterType;
    const matchesSearch =
      searchTerm === '' || file.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const processFiles = async () => {
    setIsProcessing(true);

    try {
      // First, ensure we have a project
      let currentProjectId = project?.id;
      if (!currentProjectId && projects.length > 0) {
        currentProjectId = projects[0].id;
      } else if (!currentProjectId) {
        // Create a default project
        const projectResult = await createProject({
          name: 'Default Ingestion Project',
          description: 'Project for data ingestion',
          settings: {
            autoMatch: true,
            confidenceThreshold: 0.8,
          },
        });
        if (projectResult.success && projectResult.project) {
          currentProjectId = (projectResult as { success: true; project: any }).project.id;
        }
      }

      if (!currentProjectId) {
        throw new Error('No project available for processing');
      }

      // Process all uploaded files through the API
      const processedData: DataRow[] = [];
      const qualityMetrics = {
        completeness: 0,
        accuracy: 0,
        consistency: 0,
        validity: 0,
        overall: 0,
      };

      for (const file of uploadedFiles) {
        if (file.file) {
          // Upload file to backend
          const uploadResult = await uploadFileToAPI(file.file, currentProjectId);

          if (uploadResult.success && uploadResult.job) {
            // Process the uploaded file
            const processResult = await processDataWithAPI(uploadResult.job.id, {
              delimiter: ',',
              hasHeader: true,
              encoding: 'utf-8',
            });

            if (processResult.success && processResult.records) {
              processedData.push(...processResult.records);

              // Use quality metrics from the API response
              if (processResult.job.qualityMetrics) {
                const metrics = processResult.job.qualityMetrics;
                qualityMetrics.completeness += metrics.completeness || 0;
                qualityMetrics.accuracy += metrics.accuracy || 0;
                qualityMetrics.consistency += metrics.consistency || 0;
                qualityMetrics.validity += metrics.validity || 0;
              }
            }
          }
        } else if (file.data) {
          // Fallback to local processing for existing data
          const cleanedData = cleanAndStandardizeData(file.data, file.fileType);
          const fileQuality = analyzeDataQuality(cleanedData);
          processedData.push(...cleanedData);

          // Aggregate quality metrics
          qualityMetrics.completeness += fileQuality.completeness;
          qualityMetrics.accuracy += fileQuality.accuracy;
          qualityMetrics.consistency += fileQuality.consistency;
          qualityMetrics.validity += fileQuality.validity;
        }
      }

      // Calculate average quality metrics
      const fileCount = uploadedFiles.length;
      if (fileCount > 0) {
        qualityMetrics.completeness /= fileCount;
        qualityMetrics.accuracy /= fileCount;
        qualityMetrics.consistency /= fileCount;
        qualityMetrics.validity /= fileCount;
        qualityMetrics.overall =
          (qualityMetrics.completeness +
            qualityMetrics.accuracy +
            qualityMetrics.consistency +
            qualityMetrics.validity) /
          4;
      }

      // Update cross-page data
      updateCrossPageData('ingestion', {
        files: uploadedFiles,
        processedData,
        qualityMetrics,
        validationResults: {
          isValid: qualityMetrics.overall >= 0.7,
          errors:
            qualityMetrics.overall < 0.7
              ? [
                  {
                    field: 'quality',
                    message: 'Data quality is below recommended threshold',
                    severity: 'warning' as const,
                    page: 'ingestion',
                  },
                ]
              : [],
          warnings: [],
          suggestions: [],
        },
        lastUpdated: new Date(),
      });

      // Validate transition to reconciliation
      const validation = validateCrossPageData('ingestion', 'reconciliation');

      if (validation.isValid && qualityMetrics.overall >= 0.8) {
        // Auto-advance to reconciliation
        addNotification({
          type: 'success',
          title: 'Data Processing Complete',
          message: 'Data has been processed successfully. Advancing to reconciliation.',
          page: 'ingestion',
          isRead: false,
        });

        // Auto-advance after a short delay
        setTimeout(async () => {
          await advanceWorkflow({
            id: 'reconciliation',
            name: 'AI Reconciliation',
            page: 'reconciliation',
            order: 2,
            isCompleted: false,
            isActive: true,
            validation: validation,
            data: processedData,
          });
        }, 2000);
      } else {
        addNotification({
          type: 'warning',
          title: 'Data Processing Complete',
          message: `Data processed with ${(qualityMetrics.overall * 100).toFixed(1)}% quality. Review before proceeding.`,
          page: 'ingestion',
          isRead: false,
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Processing Failed',
        message: `Failed to process uploaded files: ${error instanceof Error ? error.message : 'Unknown error'}`,
        page: 'ingestion',
        isRead: false,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const cleanData = async (file: UploadedFile) => {
    setIsCleaningData(true);
    setCleaningProgress(0);

    // Simulate data cleaning process
    const interval = setInterval(() => {
      setCleaningProgress((prev) => {
        const newProgress = Math.min(prev + Math.random() * 15, 100);
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsCleaningData(false);

          // Update file with cleaned data
          setUploadedFiles((prev) =>
            prev.map((f) => {
              if (f.id === file.id) {
                const cleanedData = cleanAndStandardizeData(f.data || [], f.fileType);
                const qualityMetrics = analyzeDataQuality(cleanedData);
                return {
                  ...f,
                  cleanedData,
                  qualityMetrics,
                  data: cleanedData,
                };
              }
              return f;
            })
          );
        }
        return newProgress;
      });
    }, 200);
  };

  const exportData = (file: UploadedFile, format: 'csv' | 'excel' | 'json') => {
    if (!file.data || file.data.length === 0) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'No data available to export',
        page: 'ingestion',
        isRead: false,
      });
      return;
    }

    try {
      let content: string;
      let mimeType: string;
      let extension: string;

      switch (format) {
        case 'csv':
          content = convertToCSV(file.data);
          mimeType = 'text/csv';
          extension = 'csv';
          break;
        case 'json':
          content = JSON.stringify(file.data, null, 2);
          mimeType = 'application/json';
          extension = 'json';
          break;
        case 'excel':
          // For now, export as CSV since we don't have Excel library
          // In a real implementation, you'd use a library like xlsx
          content = convertToCSV(file.data);
          mimeType = 'text/csv';
          extension = 'csv';
          addNotification({
            type: 'warning',
            title: 'Excel Export',
            message: 'Excel export not fully implemented. Exporting as CSV instead.',
            page: 'ingestion',
            isRead: false,
          });
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace(/\.[^/.]+$/, '')}_export.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addNotification({
        type: 'success',
        title: 'Export Complete',
        message: `Data exported as ${format.toUpperCase()}`,
        page: 'ingestion',
        isRead: false,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: `Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        page: 'ingestion',
        isRead: false,
      });
    }
  };

  const convertToCSV = (data: DataRow[]): string => {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Escape commas and quotes in CSV
            if (
              typeof value === 'string' &&
              (value.includes(',') || value.includes('"') || value.includes('\n'))
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return String(value ?? '');
          })
          .join(',')
      ),
    ];

    return csvRows.join('\n');
  };

  const previewReconciliationMatching = (file: UploadedFile) => {
    // Simulate reconciliation matching preview
    const matchingResults = {
      totalRecords: file.data?.length || 0,
      matchedRecords: Math.floor((file.data?.length || 0) * 0.85),
      unmatchedRecords: Math.floor((file.data?.length || 0) * 0.15),
      confidence: 0.92,
      suggestedMatches: [
        { sourceField: 'amount', targetField: 'transaction_amount', confidence: 0.95 },
        { sourceField: 'date', targetField: 'transaction_date', confidence: 0.98 },
        { sourceField: 'description', targetField: 'transaction_description', confidence: 0.87 },
      ],
    };

    return matchingResults;
  };

  const generateExportTemplate = (fileType: string) => {
    const templates = {
      expenses: {
        columns: ['id', 'date', 'description', 'amount', 'category', 'vendor', 'reference'],
        sampleData: [
          [
            'EXP-001',
            '2023-12-01',
            'Office Supplies',
            '150.00',
            'Administrative',
            'Office Depot',
            'REF-12345',
          ],
          [
            'EXP-002',
            '2023-12-02',
            'Travel Expenses',
            '500.00',
            'Travel',
            'Airline Co',
            'REF-12346',
          ],
        ],
      },
      bank_statement: {
        columns: ['id', 'date', 'description', 'type', 'amount', 'balance', 'reference'],
        sampleData: [
          [
            'TXN-001',
            '2023-12-01',
            'Payment Received',
            'Credit',
            '1000.00',
            '5000.00',
            'TXN-78901',
          ],
          ['TXN-002', '2023-12-02', 'Payment Sent', 'Debit', '250.00', '4750.00', 'TXN-78902'],
        ],
      },
    };

    return templates[fileType as keyof typeof templates] || templates.expenses;
  };

  const getColumnIcon = (type: ColumnInfo['type']) => {
    switch (type) {
      case 'date':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'currency':
      case 'number':
        return <DollarSign className="w-4 h-4 text-green-500" />;
      case 'string':
        return <Type className="w-4 h-4 text-gray-500" />;
      case 'boolean':
        return <CheckSquare className="w-4 h-4 text-purple-500" />;
      default:
        return <Hash className="w-4 h-4 text-gray-500" />;
    }
  };

  const getQualityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // AI-powered content extraction functions
  const extractPDFContent = async (file: File): Promise<ExtractedContent> => {
    // Simulate PDF text extraction and analysis
    return {
      text: 'Sample extracted text from PDF document. This would contain the full text content extracted using OCR and text parsing.',
      metadata: {
        pages: 5,
        author: 'John Doe',
        title: 'Sample Contract',
        creationDate: '2023-12-01',
      },
      entities: [
        { type: 'PERSON', value: 'John Doe', confidence: 0.95 },
        { type: 'ORGANIZATION', value: 'Acme Corp', confidence: 0.9 },
        { type: 'MONEY', value: '$50,000', confidence: 0.88 },
      ],
      summary:
        'This document outlines the terms and conditions for a service agreement between parties.',
      keyTerms: ['contract', 'agreement', 'terms', 'conditions', 'liability'],
      sentiment: 'neutral',
      language: 'en',
      pages: 5,
    };
  };

  const extractImageContent = async (file: File): Promise<ExtractedContent> => {
    // Simulate comprehensive image analysis including EXIF data
    const exifData: EXIFData = {
      camera: {
        make: 'Canon',
        model: 'EOS R5',
        lens: 'RF 24-70mm f/2.8L IS USM',
        serialNumber: '1234567890',
      },
      settings: {
        aperture: 'f/2.8',
        shutterSpeed: '1/125s',
        iso: 400,
        focalLength: '50mm',
        exposureMode: 'Manual',
        whiteBalance: 'Auto',
        flash: 'No Flash',
      },
      location: {
        latitude: 40.7128,
        longitude: -74.006,
        altitude: 10,
        address: 'New York, NY, USA',
      },
      timestamp: '2023-12-01T14:30:00Z',
      software: 'Adobe Lightroom Classic 12.0',
      orientation: 1,
      colorSpace: 'sRGB',
      compression: 'JPEG',
    };

    return {
      text: 'Text extracted from image using OCR technology. Invoice #12345, Amount: $1,250.00',
      metadata: {
        width: 1920,
        height: 1080,
        format: 'JPEG',
        size: file.size,
        colorDepth: 24,
        dpi: 300,
        colorProfile: 'sRGB',
      },
      entities: [
        { type: 'TEXT', value: 'Invoice #12345', confidence: 0.92 },
        { type: 'MONEY', value: '$1,250.00', confidence: 0.89 },
        { type: 'LOCATION', value: 'New York, NY', confidence: 0.85 },
      ],
      summary:
        'Business invoice document photographed with professional camera equipment in New York.',
      keyTerms: ['invoice', 'payment', 'vendor', 'amount', 'photography', 'business'],
      sentiment: 'neutral',
      resolution: '1920x1080',
      exif: exifData,
      fileSize: file.size,
      creationDate: exifData.timestamp,
      modificationDate: new Date().toISOString(),
      mimeType: file.type,
      checksum: 'sha256:abc123def456...',
    };
  };

  const extractVideoContent = async (file: File): Promise<ExtractedContent> => {
    // Simulate comprehensive video analysis with metadata
    const videoMetadata: VideoMetadata = {
      duration: 300, // 5 minutes
      resolution: {
        width: 1920,
        height: 1080,
      },
      frameRate: 30,
      bitrate: 5000000, // 5 Mbps
      codec: {
        video: 'H.264',
        audio: 'AAC',
      },
      container: 'MP4',
      creationDate: '2023-12-01T10:00:00Z',
      modificationDate: '2023-12-01T10:05:00Z',
      fileSize: file.size,
      aspectRatio: '16:9',
      colorSpace: 'Rec. 709',
      audioChannels: 2,
      audioSampleRate: 48000,
    };

    return {
      text: 'Transcribed audio content from video file. Meeting discussion about Q4 budget allocation and project timeline adjustments.',
      metadata: {
        duration: videoMetadata.duration,
        format: 'MP4',
        resolution: videoMetadata.resolution
          ? `${videoMetadata.resolution.width}x${videoMetadata.resolution.height}`
          : 'Unknown',
        fps: videoMetadata.frameRate,
        bitrate: videoMetadata.bitrate,
        codec: videoMetadata.codec,
        container: videoMetadata.container,
      },
      entities: [
        { type: 'PERSON', value: 'John Smith', confidence: 0.85 },
        { type: 'PERSON', value: 'Sarah Johnson', confidence: 0.82 },
        { type: 'ORGANIZATION', value: 'Acme Corporation', confidence: 0.8 },
        { type: 'MONEY', value: '$50,000', confidence: 0.75 },
      ],
      summary:
        'Corporate meeting recording discussing Q4 budget allocation, project timeline adjustments, and resource planning.',
      keyTerms: ['meeting', 'budget', 'project', 'timeline', 'resources', 'Q4', 'allocation'],
      sentiment: 'neutral',
      duration: videoMetadata.duration,
      resolution: videoMetadata.resolution
        ? `${videoMetadata.resolution.width}x${videoMetadata.resolution.height}`
        : 'Unknown',
      videoMetadata: videoMetadata,
      fileSize: file.size,
      creationDate: videoMetadata.creationDate,
      modificationDate: videoMetadata.modificationDate,
      mimeType: file.type,
      checksum: 'sha256:def456ghi789...',
    };
  };

  const extractChatHistory = async (file: File): Promise<ChatMessage[]> => {
    // Simulate chat history parsing
    return [
      {
        timestamp: '2023-12-01T10:30:00Z',
        sender: 'John Doe',
        content: "Hey team, let's discuss the project timeline",
        type: 'text',
      },
      {
        timestamp: '2023-12-01T10:31:00Z',
        sender: 'Jane Smith',
        content: 'I think we need to extend the deadline by 2 weeks',
        type: 'text',
      },
      {
        timestamp: '2023-12-01T10:32:00Z',
        sender: 'John Doe',
        content: 'project_timeline.pdf',
        type: 'file',
        metadata: { fileName: 'project_timeline.pdf', size: 1024000 },
      },
    ];
  };

  const analyzeContract = async (file: File): Promise<ContractAnalysis> => {
    // Simulate contract analysis
    return {
      parties: ['Acme Corporation', 'Beta Industries'],
      keyTerms: [
        { term: 'Contract Value', value: '$500,000', importance: 0.95 },
        { term: 'Duration', value: '12 months', importance: 0.9 },
        { term: 'Payment Terms', value: 'Net 30', importance: 0.85 },
      ],
      dates: [
        { type: 'Effective Date', date: '2023-12-01' },
        { type: 'Expiration Date', date: '2024-12-01' },
        { type: 'Renewal Date', date: '2024-11-01' },
      ],
      amounts: [
        { description: 'Monthly Service Fee', amount: 41666.67, currency: 'USD' },
        { description: 'Setup Fee', amount: 10000, currency: 'USD' },
      ],
      clauses: [
        {
          type: 'Termination',
          content: 'Either party may terminate with 30 days notice',
          risk: 'medium',
        },
        { type: 'Liability', content: 'Limited liability to contract value', risk: 'low' },
        { type: 'Confidentiality', content: 'Standard confidentiality terms', risk: 'low' },
      ],
      compliance: [
        { requirement: 'GDPR Compliance', status: 'compliant' },
        { requirement: 'SOX Compliance', status: 'compliant' },
        { requirement: 'Data Retention', status: 'non-compliant' },
      ],
    };
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">Data Ingestion</h1>
        <p className="text-secondary-600">Upload and process data files for reconciliation</p>
        {project && <div className="mt-2 text-sm text-primary-600">Project: {project.name}</div>}
      </div>

      {/* Workflow Orchestrator */}
      <WorkflowOrchestrator
        currentStage="ingestion"
        onStageChange={(stage) => {
          // Handle stage change
          console.log('Stage change requested:', stage);
        }}
        onValidation={(stage) => {
          // Validate current stage
          return validateCrossPageData('ingestion', stage);
        }}
        onDataSync={async (fromStage, toStage) => {
          // Sync data between stages
          console.log('Syncing data from', fromStage, 'to', toStage);
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Section */}
        <div className="lg:col-span-2">
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Upload Data Files</h2>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-secondary-300 hover:border-primary-400 hover:bg-secondary-50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
              {isDragActive ? (
                <p className="text-primary-600 font-medium">Drop the files here...</p>
              ) : (
                <div>
                  <p className="text-secondary-600 mb-2">
                    Drag & drop files here, or click to select
                  </p>
                  <p className="text-sm text-secondary-500 mb-4">
                    Supports all file types: Documents, Images, Videos, Audio, Chat Histories,
                    Contracts
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-secondary-500">
                    <span className="flex items-center">
                      <span className="mr-1">💰</span> Expenses
                    </span>
                    <span className="flex items-center">
                      <span className="mr-1">🏦</span> Bank Statements
                    </span>
                    <span className="flex items-center">
                      <span className="mr-1">💬</span> Chat Histories
                    </span>
                    <span className="flex items-center">
                      <span className="mr-1">📄</span> PDF Documents
                    </span>
                    <span className="flex items-center">
                      <span className="mr-1">🖼️</span> Images
                    </span>
                    <span className="flex items-center">
                      <span className="mr-1">🎥</span> Videos
                    </span>
                    <span className="flex items-center">
                      <span className="mr-1">🎵</span> Audio Files
                    </span>
                    <span className="flex items-center">
                      <span className="mr-1">📋</span> Contracts
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* File List */}
          {uploadedFiles.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-secondary-900">Uploaded Files</h3>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search files..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input-field pl-10 w-48"
                    />
                  </div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="input-field w-40"
                    aria-label="Filter by file type"
                  >
                    <option value="all">All Types</option>
                    <option value="expenses">💰 Expenses</option>
                    <option value="bank_statement">🏦 Bank Statements</option>
                    <option value="chat_history">💬 Chat Histories</option>
                    <option value="pdf_document">📄 PDF Documents</option>
                    <option value="image">🖼️ Images</option>
                    <option value="video">🎥 Videos</option>
                    <option value="audio">🎵 Audio</option>
                    <option value="contract">📋 Contracts</option>
                    <option value="other">📁 Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      selectedFile?.id === file.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-secondary-200 hover:border-secondary-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getFileTypeIcon(file.fileType)}</span>
                        <div>
                          <p className="font-medium text-secondary-900">{file.name}</p>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getFileTypeColor(file.fileType)}`}
                            >
                              {file.fileType.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="text-sm text-secondary-500">
                              {formatFileSize(file.size)}
                              {file.records && ` • ${file.records.toLocaleString()} records`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {file.status === 'uploading' && (
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-secondary-200 rounded-full h-2">
                              <div
                                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${file.progress}%` }}
                              />
                            </div>
                            <span className="text-sm text-secondary-600">
                              {Math.round(file.progress)}%
                            </span>
                          </div>
                        )}

                        {file.status === 'completed' && (
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />

                            {/* Quality Score */}
                            {file.qualityMetrics && (
                              <div className="flex items-center space-x-1">
                                <Shield className="w-4 h-4 text-blue-500" />
                                <span
                                  className={`text-sm font-medium ${getQualityScoreColor(file.qualityMetrics.completeness)}`}
                                >
                                  {file.qualityMetrics.completeness}%
                                </span>
                              </div>
                            )}

                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => setSelectedFile(file)}
                                className="btn-secondary text-sm flex items-center space-x-1"
                              >
                                <Eye className="w-4 h-4" />
                                <span>View</span>
                              </button>

                              <button
                                onClick={() => cleanData(file)}
                                disabled={isCleaningData}
                                className="btn-secondary text-sm flex items-center space-x-1"
                              >
                                <Wand2 className="w-4 h-4" />
                                <span>Clean</span>
                              </button>

                              <button
                                onClick={() => setShowMappingModal(true)}
                                className="btn-secondary text-sm flex items-center space-x-1"
                              >
                                <MapPin className="w-4 h-4" />
                                <span>Map</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {file.status === 'error' && (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}

                        <button
                          onClick={() => removeFile(file.id)}
                          className="text-secondary-400 hover:text-red-500"
                          title="Remove file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={processFiles}
                  disabled={isProcessing || uploadedFiles.some((f) => f.status !== 'completed')}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'Process Files'}
                </button>
              </div>
            </div>
          )}

          {/* Chat History Display */}
          {selectedFile &&
            selectedFile.fileType === 'chat_history' &&
            selectedFile.chatMessages && (
              <div className="card mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-semibold text-secondary-900">
                      Chat History: {selectedFile.name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getFileTypeColor(selectedFile.fileType)}`}
                    >
                      💬 CHAT HISTORY
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-secondary-500">
                      {selectedFile.chatMessages.length} messages
                    </span>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-3">
                  {selectedFile.chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className="flex space-x-3 p-3 border border-secondary-200 rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600">
                            {message.sender.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-secondary-900">{message.sender}</span>
                          <span className="text-xs text-secondary-500">
                            {new Date(message.timestamp).toLocaleString()}
                          </span>
                          {message.type !== 'text' && (
                            <span className="px-2 py-1 text-xs bg-secondary-100 rounded">
                              {message.type}
                            </span>
                          )}
                        </div>
                        <p className="text-secondary-700">{message.content}</p>
                        {message.metadata && (
                          <div className="mt-2 text-xs text-secondary-500">
                            {message.metadata.fileName && (
                              <span>File: {message.metadata.fileName}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Contract Analysis Display */}
          {selectedFile &&
            selectedFile.fileType === 'contract' &&
            selectedFile.contractAnalysis && (
              <div className="card mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-semibold text-secondary-900">
                      Contract Analysis: {selectedFile.name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getFileTypeColor(selectedFile.fileType)}`}
                    >
                      📋 CONTRACT
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-secondary-800 mb-3">Parties</h4>
                    <div className="space-y-2">
                      {selectedFile.contractAnalysis.parties.map((party, index) => (
                        <div key={index} className="p-2 bg-secondary-50 rounded">
                          {party}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-secondary-800 mb-3">Key Terms</h4>
                    <div className="space-y-2">
                      {selectedFile.contractAnalysis.keyTerms.map((term, index) => (
                        <div key={index} className="p-2 bg-secondary-50 rounded">
                          <div className="font-medium">{term.term}</div>
                          <div className="text-sm text-secondary-600">{term.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-secondary-800 mb-3">Important Dates</h4>
                    <div className="space-y-2">
                      {selectedFile.contractAnalysis.dates.map((date, index) => (
                        <div key={index} className="p-2 bg-secondary-50 rounded">
                          <div className="font-medium">{date.type}</div>
                          <div className="text-sm text-secondary-600">{date.date}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-secondary-800 mb-3">Compliance Status</h4>
                    <div className="space-y-2">
                      {selectedFile.contractAnalysis.compliance.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-secondary-50 rounded"
                        >
                          <span className="text-sm">{item.requirement}</span>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              item.status === 'compliant'
                                ? 'bg-green-100 text-green-800'
                                : item.status === 'non-compliant'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Multimedia Content Display */}
          {selectedFile &&
            ['image', 'video', 'audio', 'pdf_document'].includes(selectedFile.fileType) &&
            selectedFile.extractedContent && (
              <div className="card mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-semibold text-secondary-900">
                      Content Analysis: {selectedFile.name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getFileTypeColor(selectedFile.fileType)}`}
                    >
                      {selectedFile.fileType.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Preview Section */}
                  <div>
                    <h4 className="font-medium text-secondary-800 mb-3">Preview</h4>
                    {selectedFile.fileType === 'image' && selectedFile.thumbnailUrl && (
                      <Image
                        src={selectedFile.thumbnailUrl}
                        alt="Preview"
                        width={500}
                        height={500}
                        className="w-full h-64 object-cover rounded-lg border"
                      />
                    )}
                    {selectedFile.fileType === 'video' && selectedFile.previewUrl && (
                      <video
                        src={selectedFile.previewUrl}
                        controls
                        className="w-full h-64 rounded-lg border"
                      />
                    )}
                    {selectedFile.fileType === 'pdf_document' && (
                      <div className="w-full h-64 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl mb-2">📄</div>
                          <div className="text-sm text-red-600">PDF Preview</div>
                          <div className="text-xs text-red-500">
                            {selectedFile.extractedContent?.pages} pages
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Analysis Section */}
                  <div>
                    <h4 className="font-medium text-secondary-800 mb-3">AI Analysis</h4>

                    {selectedFile.extractedContent?.summary && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-secondary-700 mb-2">Summary</h5>
                        <p className="text-sm text-secondary-600 bg-secondary-50 p-3 rounded">
                          {selectedFile.extractedContent.summary}
                        </p>
                      </div>
                    )}

                    {selectedFile.extractedContent?.keyTerms && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-secondary-700 mb-2">Key Terms</h5>
                        <div className="flex flex-wrap gap-1">
                          {selectedFile.extractedContent.keyTerms.map((term, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded"
                            >
                              {term}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedFile.extractedContent?.entities && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-secondary-700 mb-2">
                          Entities Detected
                        </h5>
                        <div className="space-y-1">
                          {selectedFile.extractedContent.entities.map((entity, index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                              <span className="font-medium">{entity.value}</span>
                              <span className="text-secondary-500">{entity.type}</span>
                              <span className="text-secondary-400">
                                {Math.round(entity.confidence * 100)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* EXIF Data for Images */}
                    {selectedFile.fileType === 'image' && selectedFile.extractedContent?.exif && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-secondary-700 mb-2">
                          📸 Camera & Settings
                        </h5>
                        <div className="space-y-2 text-xs">
                          {selectedFile.extractedContent.exif.camera && (
                            <div className="bg-blue-50 p-2 rounded">
                              <div className="font-medium text-blue-800 mb-1">Camera</div>
                              <div className="space-y-1">
                                {selectedFile.extractedContent.exif.camera.make && (
                                  <div className="flex justify-between">
                                    <span>Make:</span>
                                    <span className="font-medium">
                                      {selectedFile.extractedContent.exif.camera.make}
                                    </span>
                                  </div>
                                )}
                                {selectedFile.extractedContent.exif.camera.model && (
                                  <div className="flex justify-between">
                                    <span>Model:</span>
                                    <span className="font-medium">
                                      {selectedFile.extractedContent.exif.camera.model}
                                    </span>
                                  </div>
                                )}
                                {selectedFile.extractedContent.exif.camera.lens && (
                                  <div className="flex justify-between">
                                    <span>Lens:</span>
                                    <span className="font-medium">
                                      {selectedFile.extractedContent.exif.camera.lens}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {selectedFile.extractedContent.exif.settings && (
                            <div className="bg-green-50 p-2 rounded">
                              <div className="font-medium text-green-800 mb-1">Settings</div>
                              <div className="grid grid-cols-2 gap-1">
                                {selectedFile.extractedContent.exif.settings.aperture && (
                                  <div className="flex justify-between">
                                    <span>Aperture:</span>
                                    <span className="font-medium">
                                      {selectedFile.extractedContent.exif.settings.aperture}
                                    </span>
                                  </div>
                                )}
                                {selectedFile.extractedContent.exif.settings.shutterSpeed && (
                                  <div className="flex justify-between">
                                    <span>Shutter:</span>
                                    <span className="font-medium">
                                      {selectedFile.extractedContent.exif.settings.shutterSpeed}
                                    </span>
                                  </div>
                                )}
                                {selectedFile.extractedContent.exif.settings.iso && (
                                  <div className="flex justify-between">
                                    <span>ISO:</span>
                                    <span className="font-medium">
                                      {selectedFile.extractedContent.exif.settings.iso}
                                    </span>
                                  </div>
                                )}
                                {selectedFile.extractedContent.exif.settings.focalLength && (
                                  <div className="flex justify-between">
                                    <span>Focal Length:</span>
                                    <span className="font-medium">
                                      {selectedFile.extractedContent.exif.settings.focalLength}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {selectedFile.extractedContent.exif.location && (
                            <div className="bg-purple-50 p-2 rounded">
                              <div className="font-medium text-purple-800 mb-1">📍 Location</div>
                              <div className="space-y-1">
                                {selectedFile.extractedContent.exif.location.address && (
                                  <div>{selectedFile.extractedContent.exif.location.address}</div>
                                )}
                                {selectedFile.extractedContent.exif.location.latitude && (
                                  <div className="flex justify-between">
                                    <span>Coordinates:</span>
                                    <span className="font-mono text-xs">
                                      {selectedFile.extractedContent.exif.location.latitude.toFixed(
                                        4
                                      )}
                                      ,
                                      {selectedFile.extractedContent.exif.location.longitude?.toFixed(
                                        4
                                      )}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Video Metadata */}
                    {selectedFile.fileType === 'video' &&
                      selectedFile.extractedContent?.videoMetadata && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-secondary-700 mb-2">
                            🎥 Video Details
                          </h5>
                          <div className="space-y-2 text-xs">
                            <div className="bg-orange-50 p-2 rounded">
                              <div className="font-medium text-orange-800 mb-1">
                                Technical Specs
                              </div>
                              <div className="grid grid-cols-2 gap-1">
                                {selectedFile.extractedContent.videoMetadata.duration && (
                                  <div className="flex justify-between">
                                    <span>Duration:</span>
                                    <span className="font-medium">
                                      {Math.floor(
                                        selectedFile.extractedContent.videoMetadata.duration / 60
                                      )}
                                      :
                                      {String(
                                        selectedFile.extractedContent.videoMetadata.duration % 60
                                      ).padStart(2, '0')}
                                    </span>
                                  </div>
                                )}
                                {selectedFile.extractedContent.videoMetadata.resolution && (
                                  <div className="flex justify-between">
                                    <span>Resolution:</span>
                                    <span className="font-medium">
                                      {selectedFile.extractedContent.videoMetadata.resolution.width}
                                      x
                                      {
                                        selectedFile.extractedContent.videoMetadata.resolution
                                          .height
                                      }
                                    </span>
                                  </div>
                                )}
                                {selectedFile.extractedContent.videoMetadata.frameRate && (
                                  <div className="flex justify-between">
                                    <span>Frame Rate:</span>
                                    <span className="font-medium">
                                      {selectedFile.extractedContent.videoMetadata.frameRate} fps
                                    </span>
                                  </div>
                                )}
                                {selectedFile.extractedContent.videoMetadata.bitrate && (
                                  <div className="flex justify-between">
                                    <span>Bitrate:</span>
                                    <span className="font-medium">
                                      {Math.round(
                                        selectedFile.extractedContent.videoMetadata.bitrate /
                                          1000000
                                      )}{' '}
                                      Mbps
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {selectedFile.extractedContent.videoMetadata.codec && (
                              <div className="bg-blue-50 p-2 rounded">
                                <div className="font-medium text-blue-800 mb-1">Codecs</div>
                                <div className="space-y-1">
                                  {selectedFile.extractedContent.videoMetadata.codec.video && (
                                    <div className="flex justify-between">
                                      <span>Video:</span>
                                      <span className="font-medium">
                                        {selectedFile.extractedContent.videoMetadata.codec.video}
                                      </span>
                                    </div>
                                  )}
                                  {selectedFile.extractedContent.videoMetadata.codec.audio && (
                                    <div className="flex justify-between">
                                      <span>Audio:</span>
                                      <span className="font-medium">
                                        {selectedFile.extractedContent.videoMetadata.codec.audio}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {selectedFile.extractedContent.videoMetadata.audioChannels && (
                              <div className="bg-green-50 p-2 rounded">
                                <div className="font-medium text-green-800 mb-1">Audio</div>
                                <div className="grid grid-cols-2 gap-1">
                                  <div className="flex justify-between">
                                    <span>Channels:</span>
                                    <span className="font-medium">
                                      {selectedFile.extractedContent.videoMetadata.audioChannels}
                                    </span>
                                  </div>
                                  {selectedFile.extractedContent.videoMetadata.audioSampleRate && (
                                    <div className="flex justify-between">
                                      <span>Sample Rate:</span>
                                      <span className="font-medium">
                                        {
                                          selectedFile.extractedContent.videoMetadata
                                            .audioSampleRate
                                        }{' '}
                                        Hz
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    {selectedFile.extractedContent?.metadata && (
                      <div>
                        <h5 className="text-sm font-medium text-secondary-700 mb-2">
                          File Information
                        </h5>
                        <div className="space-y-1 text-xs">
                          {Object.entries(selectedFile.extractedContent.metadata).map(
                            ([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-secondary-600">{key}:</span>
                                <span className="text-secondary-800">{String(value)}</span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          {/* Enhanced Interactive Table Display */}
          {selectedFile && selectedFile.data && (
            <div className="card mt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-semibold text-secondary-900">
                    Data Preview: {selectedFile.name}
                  </h3>
                  {selectedFile.qualityMetrics && (
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <span
                        className={`text-sm font-medium ${getQualityScoreColor(selectedFile.qualityMetrics.completeness)}`}
                      >
                        Quality: {selectedFile.qualityMetrics.completeness}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getFileTypeColor(selectedFile.fileType)}`}
                  >
                    {selectedFile.fileType.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-sm text-secondary-500">
                    {processedData.length.toLocaleString()} records
                  </span>
                </div>
              </div>

              {/* Table Controls */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowMappingModal(true)}
                    className="btn-secondary text-sm flex items-center space-x-1"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Field Mapping</span>
                  </button>

                  <button
                    onClick={() => setShowQualityReport(true)}
                    className="btn-secondary text-sm flex items-center space-x-1"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Quality Report</span>
                  </button>

                  {selectedFile.validations && selectedFile.validations.length > 0 && (
                    <button
                      onClick={() => setShowValidationReport(true)}
                      className="btn-secondary text-sm flex items-center space-x-1"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Validation Report</span>
                      <span className="bg-red-100 text-red-800 text-xs px-1 rounded">
                        {selectedFile.validations.filter((v) => v.severity === 'error').length}
                      </span>
                    </button>
                  )}

                  <div className="relative">
                    <button className="btn-secondary text-sm flex items-center space-x-1">
                      <Columns className="w-4 h-4" />
                      <span>Columns</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={pagination.pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="input-field w-20 text-sm"
                    aria-label="Records per page"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>

                  <span className="text-sm text-secondary-500">
                    {selectedRows.size > 0 && `${selectedRows.size} selected`}
                  </span>
                </div>
              </div>

              {/* Filters */}
              {filters.length > 0 && (
                <div className="mb-4 flex items-center space-x-2">
                  <span className="text-sm text-secondary-600">Filters:</span>
                  {filters.map((filter, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-1 bg-primary-100 px-2 py-1 rounded"
                    >
                      <span className="text-sm">
                        {filter.field} {filter.operator} {filter.value}
                      </span>
                      <button
                        onClick={() => removeFilter(filter.field)}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-secondary-500 hover:text-secondary-700"
                  >
                    Clear all
                  </button>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-secondary-200">
                  <thead>
                    <tr className="bg-secondary-50">
                      <th className="border border-secondary-200 px-2 py-2 text-left">
                        <input
                          type="checkbox"
                          checked={
                            selectedRows.size === filteredData.length && filteredData.length > 0
                          }
                          onChange={toggleAllRowsSelection}
                          className="rounded"
                          title="Select all rows"
                          aria-label="Select all rows"
                        />
                      </th>
                      {selectedFile.columns?.map((column, index) => (
                        <th
                          key={index}
                          className="border border-secondary-200 px-4 py-2 text-left text-sm font-medium text-secondary-700 cursor-pointer hover:bg-secondary-100"
                          onClick={() => handleSort(column.name)}
                        >
                          <div className="flex items-center space-x-2">
                            {getColumnIcon(column.type)}
                            <span>{column.name}</span>
                            {sortConfig?.field === column.name &&
                              (sortConfig.direction === 'asc' ? (
                                <SortAsc className="w-4 h-4" />
                              ) : (
                                <SortDesc className="w-4 h-4" />
                              ))}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((row, rowIndex) => (
                      <tr
                        key={row.id}
                        className={`hover:bg-secondary-50 ${selectedRows.has(row.id) ? 'bg-primary-50' : ''}`}
                      >
                        <td className="border border-secondary-200 px-2 py-2">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(row.id)}
                            onChange={() => toggleRowSelection(row.id)}
                            className="rounded"
                            title={`Select row ${row.id}`}
                            aria-label={`Select row ${row.id}`}
                          />
                        </td>
                        {selectedFile.columns?.map((column, colIndex) => (
                          <td
                            key={colIndex}
                            className="border border-secondary-200 px-4 py-2 text-sm text-secondary-600"
                          >
                            {column.type === 'currency' || column.type === 'number' ? (
                              <span className="font-mono">
                                ${parseFloat(String(row[column.name] || 0)).toFixed(2)}
                              </span>
                            ) : column.type === 'date' ? (
                              <span className="text-blue-600">
                                {String(row[column.name] || '')}
                              </span>
                            ) : column.name.toLowerCase().includes('status') ? (
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  String(row[column.name] || '') === 'Approved'
                                    ? 'bg-green-100 text-green-800'
                                    : String(row[column.name] || '') === 'Pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {String(row[column.name] || '')}
                              </span>
                            ) : column.name.toLowerCase().includes('type') ? (
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  row[column.name] === 'Credit'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {row[column.name]}
                              </span>
                            ) : (
                              <span>{row[column.name]}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-secondary-500">
                  Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
                  {Math.min(pagination.page * pagination.pageSize, processedData.length)} of{' '}
                  {processedData.length} records
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="btn-secondary text-sm disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-sm text-secondary-600">
                    Page {pagination.page} of{' '}
                    {Math.ceil(processedData.length / pagination.pageSize)}
                  </span>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={
                      pagination.page >= Math.ceil(processedData.length / pagination.pageSize)
                    }
                    className="btn-secondary text-sm disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => exportData(selectedFile, 'csv')}
                  className="btn-secondary text-sm flex items-center space-x-1"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => exportData(selectedFile, 'excel')}
                  className="btn-secondary text-sm flex items-center space-x-1"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Excel</span>
                </button>
                <button
                  onClick={() => {
                    const matchingResults = previewReconciliationMatching(selectedFile);
                    console.log('Reconciliation Preview:', matchingResults);
                  }}
                  className="btn-secondary text-sm flex items-center space-x-1"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview Matching</span>
                </button>
                <button className="btn-primary text-sm">Use for Reconciliation</button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Data Sources */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Data Sources</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Database className="w-5 h-5 text-primary-600" />
                  <span className="font-medium">System A</span>
                </div>
                <span className="text-sm text-green-600">Connected</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Database className="w-5 h-5 text-primary-600" />
                  <span className="font-medium">System B</span>
                </div>
                <span className="text-sm text-green-600">Connected</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Database className="w-5 h-5 text-secondary-400" />
                  <span className="font-medium">External API</span>
                </div>
                <span className="text-sm text-red-600">Disconnected</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  const template = generateExportTemplate('expenses');
                  console.log('Downloading expenses template:', template);
                }}
                className="w-full btn-secondary text-left flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Expenses Template</span>
              </button>
              <button
                onClick={() => {
                  const template = generateExportTemplate('bank_statement');
                  console.log('Downloading bank statement template:', template);
                }}
                className="w-full btn-secondary text-left flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Bank Statement Template</span>
              </button>
              <button className="w-full btn-secondary text-left flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Configure Mapping</span>
              </button>
              <button className="w-full btn-secondary text-left flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>AI Auto-Mapping</span>
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-secondary-600">Total Files:</span>
                <span className="font-medium">{uploadedFiles.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Total Records:</span>
                <span className="font-medium">
                  {uploadedFiles
                    .reduce((sum, file) => sum + (file.records || 0), 0)
                    .toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Processed:</span>
                <span className="font-medium text-green-600">
                  {uploadedFiles.filter((f) => f.status === 'completed').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Field Mapping Modal */}
      {showMappingModal && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-secondary-900">
                Field Mapping: {selectedFile.name}
              </h3>
              <button
                onClick={() => setShowMappingModal(false)}
                className="text-secondary-400 hover:text-secondary-600"
                title="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-medium text-secondary-800 mb-3">Source Fields</h4>
                <div className="space-y-2">
                  {selectedFile.columns?.map((column, index) => (
                    <div key={index} className="p-3 border border-secondary-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        {getColumnIcon(column.type)}
                        <span className="font-medium">{column.name}</span>
                        <span className="text-sm text-secondary-500">({column.type})</span>
                      </div>
                      <div className="text-sm text-secondary-600 mt-1">
                        Sample:{' '}
                        {column.sampleValues
                          .slice(0, 2)
                          .map((v) => String(v || ''))
                          .join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-secondary-800 mb-3">Target Fields</h4>
                <div className="space-y-2">
                  {['Date', 'Description', 'Amount', 'Category', 'Vendor', 'Reference'].map(
                    (field, index) => (
                      <div
                        key={index}
                        className="p-3 border border-secondary-200 rounded-lg bg-secondary-50"
                      >
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-primary-600" />
                          <span className="font-medium">{field}</span>
                        </div>
                        <div className="text-sm text-secondary-500 mt-1">
                          Drag source field here
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button onClick={() => setShowMappingModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button className="btn-primary">Save Mapping</button>
            </div>
          </div>
        </div>
      )}

      {/* Data Validation Report Modal */}
      {showValidationReport && selectedFile && selectedFile.validations && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-secondary-900">
                Validation Report: {selectedFile.name}
              </h3>
              <button
                onClick={() => setShowValidationReport(false)}
                className="text-secondary-400 hover:text-secondary-600"
                title="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className="font-medium text-red-800">Errors</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {selectedFile.validations.filter((v) => v.severity === 'error').length}
                  </div>
                </div>

                <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <span className="font-medium text-yellow-800">Warnings</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {selectedFile.validations.filter((v) => v.severity === 'warning').length}
                  </div>
                </div>

                <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <div className="flex items-center space-x-2 mb-2">
                    <Info className="w-5 h-5 text-blue-500" />
                    <span className="font-medium text-blue-800">Info</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedFile.validations.filter((v) => v.severity === 'info').length}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-secondary-800 mb-3">Validation Details</h4>
              {selectedFile.validations.map((validation, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg ${
                    validation.severity === 'error'
                      ? 'border-red-200 bg-red-50'
                      : validation.severity === 'warning'
                        ? 'border-yellow-200 bg-yellow-50'
                        : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {validation.severity === 'error' ? (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      ) : validation.severity === 'warning' ? (
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <Info className="w-4 h-4 text-blue-500" />
                      )}
                      <span className="font-medium">{validation.field}</span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          validation.severity === 'error'
                            ? 'bg-red-100 text-red-800'
                            : validation.severity === 'warning'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {validation.rule}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        validation.severity === 'error'
                          ? 'text-red-600'
                          : validation.severity === 'warning'
                            ? 'text-yellow-600'
                            : 'text-blue-600'
                      }`}
                    >
                      {validation.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                  <p className="text-sm text-secondary-600">{validation.message}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button onClick={() => setShowValidationReport(false)} className="btn-secondary">
                Close
              </button>
              <button onClick={() => cleanData(selectedFile)} className="btn-primary">
                Fix Issues
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Quality Report Modal */}
      {showQualityReport && selectedFile && selectedFile.qualityMetrics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-secondary-900">
                Data Quality Report: {selectedFile.name}
              </h3>
              <button
                onClick={() => setShowQualityReport(false)}
                className="text-secondary-400 hover:text-secondary-600"
                title="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 border border-secondary-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">Completeness</span>
                </div>
                <div
                  className={`text-2xl font-bold ${getQualityScoreColor(selectedFile.qualityMetrics.completeness)}`}
                >
                  {selectedFile.qualityMetrics.completeness}%
                </div>
                <div className="text-sm text-secondary-500">
                  {selectedFile.qualityMetrics.completeness >= 90
                    ? 'Excellent'
                    : selectedFile.qualityMetrics.completeness >= 70
                      ? 'Good'
                      : 'Needs Improvement'}
                </div>
              </div>

              <div className="p-4 border border-secondary-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium">Accuracy</span>
                </div>
                <div
                  className={`text-2xl font-bold ${getQualityScoreColor(selectedFile.qualityMetrics.accuracy)}`}
                >
                  {selectedFile.qualityMetrics.accuracy}%
                </div>
                <div className="text-sm text-secondary-500">
                  {selectedFile.qualityMetrics.duplicates} duplicates found
                </div>
              </div>

              <div className="p-4 border border-secondary-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                  <span className="font-medium">Consistency</span>
                </div>
                <div
                  className={`text-2xl font-bold ${getQualityScoreColor(selectedFile.qualityMetrics.consistency)}`}
                >
                  {selectedFile.qualityMetrics.consistency}%
                </div>
                <div className="text-sm text-secondary-500">Data format consistency</div>
              </div>

              <div className="p-4 border border-secondary-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="font-medium">Errors</span>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {selectedFile.qualityMetrics.errors}
                </div>
                <div className="text-sm text-secondary-500">Validation errors found</div>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-secondary-800 mb-2">Recommendations</h4>
              <div className="space-y-2">
                {selectedFile.qualityMetrics.completeness < 90 && (
                  <div className="flex items-center space-x-2 text-sm text-yellow-600">
                    <Info className="w-4 h-4" />
                    <span>Consider cleaning missing values to improve completeness</span>
                  </div>
                )}
                {selectedFile.qualityMetrics.duplicates > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-yellow-600">
                    <Info className="w-4 h-4" />
                    <span>Remove {selectedFile.qualityMetrics.duplicates} duplicate records</span>
                  </div>
                )}
                {selectedFile.qualityMetrics.errors > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Fix {selectedFile.qualityMetrics.errors} validation errors</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowQualityReport(false)} className="btn-secondary">
                Close
              </button>
              <button onClick={() => cleanData(selectedFile)} className="btn-primary">
                Clean Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Cleaning Progress Modal */}
      {isCleaningData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-primary-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">Cleaning Data</h3>
              <p className="text-secondary-600 mb-4">
                Standardizing formats and removing duplicates...
              </p>
              <div className="w-full bg-secondary-200 rounded-full h-2 mb-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${cleaningProgress}%` }}
                />
              </div>
              <p className="text-sm text-secondary-500">{Math.round(cleaningProgress)}% complete</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IngestionPage;
