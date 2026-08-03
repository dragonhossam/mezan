/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  FolderOpen, 
  FileText, 
  Search, 
  Upload, 
  Download, 
  Trash2, 
  Eye, 
  X, 
  Plus, 
  Paperclip, 
  RefreshCw, 
  Check, 
  File, 
  Folder,
  History,
  ShieldAlert,
  Sparkles
} from "lucide-react";
import { 
  User as UserType, 
  Case, 
  Document, 
  DocumentType, 
  DocumentVersion 
} from "../types";

interface DocumentsViewProps {
  currentUser: UserType;
  documents: Document[];
  cases: Case[];
  clients: any[];
  onUploadDocument: (caseId: string, docData: Omit<Document, "id" | "caseId" | "versions" | "uploadedBy" | "uploadedById" | "timestamp">) => void;
  onUploadNewVersion: (docId: string, versionData: { fileName: string; fileSize: string }) => void;
  onDeleteDocument: (docId: string) => void;
  darkMode: boolean;
}

export default function DocumentsView({
  currentUser,
  documents,
  cases,
  clients,
  onUploadDocument,
  onUploadNewVersion,
  onDeleteDocument,
  darkMode
}: DocumentsViewProps) {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(cases[0]?.id || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<Document | null>(null);

  // Upload progress simulation
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Version Upload simulation
  const [isUploadingNewVersion, setIsUploadingNewVersion] = useState(false);
  const [newVersionProgress, setNewVersionProgress] = useState(0);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    type: "صحيفة دعوى" as DocumentType,
    fileName: "",
    fileSize: "1.2 MB",
    notes: ""
  });
  
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const handleGenerateAiNotes = async (context: string) => {
    setIsGeneratingAi(true);
    try {
      const response = await fetch("/api/suggest-legal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "document", caseType: formData.type || "مستند", context })
      });
      const data = await response.json();
      if (data.suggestion) {
        setFormData(prev => ({ ...prev, notes: data.suggestion }));
      } else {
        alert("فشل في استرداد الاقتراح");
      }
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء الاتصال بالمساعد الذكي");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Check Permissions
  const canAdd = currentUser.permissions.add;
  const canDelete = currentUser.permissions.delete;

  const currentCase = cases.find(c => c.id === selectedCaseId);
  const currentCaseClient = currentCase ? clients.find(cl => cl.id === currentCase.clientId) : null;
  const caseDocs = documents.filter(d => d.caseId === selectedCaseId);

  // Search filter
  const filteredDocs = caseDocs.filter(d => {
    const term = searchQuery.toLowerCase();
    return (d.title || "").toLowerCase().includes(term) || (d.fileName || "").toLowerCase().includes(term) || (d.type || "").toLowerCase().includes(term);
  });

  // Simulation of file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setFormData({
        ...formData,
        fileName: file.name,
        fileSize: `${sizeMB} MB`
      });
    }
  };

  const handleStartSimulatedUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.fileName) {
      alert("الرجاء تحديد عنوان للمستند واختيار ملف قانوني للرفع.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onUploadDocument(selectedCaseId, {
              title: formData.title,
              type: formData.type,
              fileName: formData.fileName,
              fileSize: formData.fileSize,
              notes: formData.notes
            });
            setIsUploading(false);
            setUploadProgress(0);
            setIsUploadModalOpen(false);
            setFormData({
              title: "",
              type: "صحيفة دعوى",
              fileName: "",
              fileSize: "1.2 MB",
              notes: ""
            });
          }, 400);
          return 100;
        }
        return prev + 15;
      });
    }, 100);
  };

  // Simulate uploading a new version (Version History test)
  const handleUploadNewVersionSimulate = (doc: Document) => {
    setIsUploadingNewVersion(true);
    setNewVersionProgress(10);

    const interval = setInterval(() => {
      setNewVersionProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const fileNames = ["Draft_V2_Review.pdf", "Official_Final_Stamped.pdf", "Legal_Memo_Amended.pdf"];
            const randomFile = fileNames[Math.floor(Math.random() * fileNames.length)];
            
            onUploadNewVersion(doc.id, {
              fileName: randomFile,
              fileSize: "2.4 MB"
            });
            
            setIsUploadingNewVersion(false);
            setNewVersionProgress(0);
            
            // Refresh preview object reference to show updated versions
            const updatedDoc = documents.find(d => d.id === doc.id);
            if (updatedDoc) setSelectedDocForPreview(updatedDoc);
          }, 400);
          return 100;
        }
        return prev + 20;
      });
    }, 100);
  };

  const handleDelete = (id: string) => {
    if (!canDelete) return;
    if (confirm("هل أنت متأكد من حذف هذا المستند نهائياً من الأرشيف السحابي للمكتب؟")) {
      onDeleteDocument(id);
      if (selectedDocForPreview?.id === id) setSelectedDocForPreview(null);
    }
  };

  const documentTypes: DocumentType[] = [
    "توكيل", "صحيفة دعوى", "مذكرة", "حكم", "محضر", "عقد", "إيصال", "مستندات العميل", "مستندات الخصم", "أخرى"
  ];

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold font-sans ${darkMode ? "text-white" : "text-slate-900"}`}>الأرشيف الإلكتروني ومستودع المستندات</h2>
          <p className="text-xs text-slate-500 mt-1">تخزين ملفات القضايا والتوكيلات بصيغ PDF و Word مع الحفظ التلقائي لإصدارات التعديل وسجل التعديل.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            disabled={!canAdd}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              canAdd 
                ? "bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer shadow-md shadow-amber-500/10" 
                : "bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-600 cursor-not-allowed"
            }`}
          >
            <Upload className="w-4 h-4" />
            أرشفة مستند جديد
          </button>
        </div>
      </div>

      {!canAdd && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs flex items-center gap-2 text-amber-500">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>دورك الحالي <strong>({currentUser.role})</strong> لا يتضمن صلاحية أرشفة المستندات أو تعديل ملفات الموكلين.</span>
        </div>
      )}

      {/* Main Grid Layout: Right folder structure, Left files catalogue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Right Pane: Cases Folders List (Directories simulation) */}
        <div className="lg:col-span-1 space-y-4">
          <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <h3 className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-amber-500" />
              مجلدات قضايا الموكلين
            </h3>

            <div className="space-y-1.5 overflow-y-auto max-h-[500px] pr-1">
              {cases.filter(c => !c.isDeleted).map(c => {
                const isSelected = selectedCaseId === c.id;
                const docCount = documents.filter(d => d.caseId === c.id).length;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCaseId(c.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between text-right cursor-pointer transition-all ${
                      isSelected
                        ? "bg-amber-500/15 border-amber-500"
                        : darkMode
                          ? "bg-slate-950 border-slate-900/60 hover:bg-slate-800/40"
                          : "bg-slate-50 border-slate-100 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate max-w-[150px]">
                      <Folder className={`w-4 h-4 ${isSelected ? "text-amber-500 fill-amber-500/20" : "text-slate-500"}`} />
                      <div className="truncate">
                        <h4 className={`text-xs font-bold truncate ${darkMode ? "text-white" : "text-slate-800"}`}>{c.caseNumber}</h4>
                        <p className="text-[10px] text-slate-400 truncate">{clients.find(cl => cl.id === c.clientId)?.name}</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-slate-900 text-slate-400 font-mono px-2 py-0.5 rounded-full font-bold">
                      {docCount} ملف
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Left Pane: Archive Files Area */}
        <div className="lg:col-span-2 space-y-4">
          <div className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            
            {/* Folder Header info & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
              <div className="text-right">
                <h3 className={`text-sm font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
                  📂 محتويات المجلد: قضية {currentCase?.caseNumber}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">الموكل: {currentCaseClient?.name || "عام"}</p>
              </div>

              {/* Internal Search */}
              <div className="relative max-w-xs w-full">
                <input
                  type="text"
                  placeholder="ابحث في مستندات المجلد..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pr-9 pl-4 py-1.5 rounded-xl text-xs border focus:outline-none transition-colors ${
                    darkMode 
                      ? "bg-slate-950 border-slate-800 text-white focus:border-amber-400" 
                      : "bg-slate-50 border-slate-200 text-slate-800 focus:border-amber-500"
                  }`}
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
              </div>
            </div>

            {/* Files List Layout */}
            {filteredDocs.length === 0 ? (
              <div className="text-center py-16 text-xs text-slate-500">
                لا توجد مستندات قانونية أو توكيلات محفوظة في هذا المجلد بعد.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredDocs.map(doc => (
                  <div 
                    key={doc.id}
                    className={`p-4 rounded-xl border ${
                      darkMode ? "bg-slate-950/60 border-slate-900 hover:border-slate-800" : "bg-slate-50 border-slate-100 hover:border-slate-200"
                    } flex flex-col justify-between text-right space-y-3`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded">
                          {doc.type}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{doc.fileSize}</span>
                      </div>
                      <h4 className={`text-xs font-bold mt-2 truncate ${darkMode ? "text-white" : "text-slate-800"}`} title={doc.title}>
                        {doc.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-1 truncate">{doc.fileName}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/40 flex items-center justify-between">
                      <span className="text-[9px] text-slate-400">قيد: {doc.timestamp}</span>
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedDocForPreview(doc)}
                          className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 flex items-center justify-center cursor-pointer"
                          title="معاينة وعرض النسخ"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <a 
                          href="#" 
                          onClick={(e) => { e.preventDefault(); alert(`بدء تحميل الملف القانوني: ${doc.fileName}`); }}
                          className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center justify-center"
                          title="تحميل"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          disabled={!canDelete}
                          className={`p-1.5 rounded border flex items-center justify-center transition-colors ${
                            canDelete 
                              ? "bg-slate-900 hover:bg-rose-500 text-rose-500 hover:text-white border-slate-800 hover:border-rose-500 cursor-pointer" 
                              : "bg-slate-200 dark:bg-slate-800 text-slate-400 border-slate-100 cursor-not-allowed"
                          }`}
                          title="حذف المستند"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Add Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border shadow-xl overflow-hidden text-right ${
            darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-950/20">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-500" />
                أرشفة مستند جديد للملف القضائي
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleStartSimulatedUpload} className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">المجلد المستهدف (رقم القضية)</label>
                <select 
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  {cases.filter(c => !c.isDeleted).map(c => (
                    <option key={c.id} value={c.id}>قضية {c.caseNumber} - {clients.find(cl => cl.id === c.clientId)?.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">الاسم التعريفي للمستند *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="مثال: الصيغة التنفيذية للحكم الاستئنافي"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">تصنيف الأرشفة *</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    {documentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Drag and Drop simulation */}
              <div className="p-6 border-2 border-dashed border-slate-800 rounded-xl text-center bg-slate-950/20 space-y-2 flex flex-col items-center">
                <Paperclip className="w-8 h-8 text-amber-500 stroke-[1.5]" />
                <p className="text-xs text-slate-300">اسحب الملف القانوني هنا أو انقر للتصفح</p>
                <p className="text-[10px] text-slate-500">يدعم صيغ PDF، Word ومسح الصور الضوئي حتى حجم ١٥ ميجابايت.</p>
                
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  className="hidden" 
                  id="doc-uploader-input" 
                />
                <label 
                  htmlFor="doc-uploader-input" 
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-bold cursor-pointer transition-colors"
                >
                  اختر ملف
                </label>
                
                {formData.fileName && (
                  <p className="text-xs text-emerald-500 font-mono font-bold mt-2">
                    📁 تم اختيار: {formData.fileName} ({formData.fileSize})
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs text-slate-400">ملاحظات الفهرسة</label>
                  <button
                    type="button"
                    onClick={() => handleGenerateAiNotes(formData.title || "بدون عنوان")}
                    disabled={isGeneratingAi}
                    className="text-[10px] flex items-center gap-1 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 px-2 py-1 rounded transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3" />
                    {isGeneratingAi ? "جاري الاقتراح..." : "صياغة ذكية بالذكاء الاصطناعي"}
                  </button>
                </div>
                <textarea 
                  placeholder="ملاحظات سرية حول سلامة التوقيع، عدد النسخ المرفوعة..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={4}
                  className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>

              {/* Progress Simulator Bar */}
              {isUploading && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 font-mono">
                    <span>يرفع للمستودع السحابي الآمن للمكتب...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full transition-all duration-100" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  disabled={isUploading || !formData.fileName}
                  className={`px-4 py-2 rounded-lg text-slate-950 text-xs font-bold transition-all ${
                    isUploading || !formData.fileName
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-amber-500 hover:bg-amber-600 cursor-pointer"
                  }`}
                >
                  رفع وأرشفة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Detail Preview & Version History Overlay Modal */}
      {selectedDocForPreview && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-xl rounded-2xl border shadow-xl overflow-hidden text-right ${
            darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-950/20">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                معاينة وسجل إصدارات المستند
              </h3>
              <button onClick={() => setSelectedDocForPreview(null)} className="p-1 rounded hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 space-y-5">
              {/* Main file characteristics */}
              <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl grid grid-cols-2 gap-4 text-right">
                <div>
                  <span className="text-[10px] text-slate-500 block">عنوان المستند</span>
                  <span className="text-xs font-bold text-amber-500">{selectedDocForPreview.title}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">التصنيف</span>
                  <span className="text-xs font-bold">{selectedDocForPreview.type}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">اسم الملف الحالي</span>
                  <span className="text-xs font-mono text-slate-300 break-all">{selectedDocForPreview.fileName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">الحجم والتوقيت</span>
                  <span className="text-xs text-slate-300 font-mono">{selectedDocForPreview.fileSize} | {selectedDocForPreview.timestamp}</span>
                </div>
              </div>

              {selectedDocForPreview.notes && (
                <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs text-slate-400">
                  📌 <strong>ملاحظات الفهرسة:</strong> {selectedDocForPreview.notes}
                </div>
              )}

              {/* Version History Archive list */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <History className="w-3.5 h-3.5 text-amber-500" />
                    تاريخ تعديل الإصدارات (Version History)
                  </h4>
                  
                  <button
                    onClick={() => handleUploadNewVersionSimulate(selectedDocForPreview)}
                    disabled={isUploadingNewVersion || !canAdd}
                    className="text-[10px] text-amber-400 hover:text-amber-500 flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <RefreshCw className={`w-3 h-3 ${isUploadingNewVersion && "animate-spin"}`} />
                    رفع مسودة / إصدار جديد
                  </button>
                </div>

                {/* Progress bar for version */}
                {isUploadingNewVersion && (
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${newVersionProgress}%` }}></div>
                  </div>
                )}

                <div className="space-y-2 border-r border-slate-800 pr-3 relative">
                  {/* Active latest version */}
                  <div className="relative">
                    <span className="absolute -right-[17.5px] top-1 w-2 h-2 rounded-full bg-emerald-500"></span>
                    <div className="text-right">
                      <p className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                        الإصدار الحالي الأخير
                        <span className="text-[9px] bg-emerald-500/10 px-1 py-0.2 rounded font-mono">LATEST</span>
                      </p>
                      <p className="text-[11px] text-slate-300 mt-0.5 font-mono">{selectedDocForPreview.fileName} ({selectedDocForPreview.fileSize})</p>
                      <p className="text-[9px] text-slate-500">مرفوع بواسطة: {selectedDocForPreview.uploadedBy} | {selectedDocForPreview.timestamp}</p>
                    </div>
                  </div>

                  {/* Previous versions if any */}
                  {selectedDocForPreview.versions && selectedDocForPreview.versions.length > 0 ? (
                    selectedDocForPreview.versions.map((ver, idx) => (
                      <div key={idx} className="relative pt-2 mt-2 border-t border-slate-800/40">
                        <span className="absolute -right-[17.5px] top-3 w-2 h-2 rounded-full bg-slate-600"></span>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-400">إصدار قديم مسودة ({ver.version})</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{ver.fileName} ({ver.fileSize})</p>
                          <p className="text-[9px] text-slate-500">معدل بواسطة: {ver.uploadedBy} | {ver.timestamp}</p>
                        </div>
                      </div>
                    ))
                  ) : null}
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-200 dark:border-slate-800 pt-4">
                <button 
                  onClick={() => setSelectedDocForPreview(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
                >
                  إغلاق المعاينة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
