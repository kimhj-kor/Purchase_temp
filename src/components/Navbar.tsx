import React from 'react';
import { ClipboardList, Plus, FileSpreadsheet, RotateCcw, UploadCloud, LogOut, User } from 'lucide-react';
import { BASE_DATE } from '../utils/calculator';

interface NavbarProps {
  totalCount: number;
  userEmail?: string;
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  onResetData: () => void;
  onExportCsv: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  totalCount,
  userEmail,
  onOpenAddModal,
  onOpenImportModal,
  onResetData,
  onExportCsv,
  onLogout,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-sm flex items-center justify-center">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">구매 견적 비교 및 납기 판정기</h1>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium border border-blue-200">
                  기준일: {BASE_DATE}
                </span>
              </div>
              <p className="text-xs text-slate-500">총 {totalCount}건의 견적·발주 데이터 실시간 검증 중</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {userEmail && (
              <div className="hidden lg:flex items-center space-x-1 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span className="max-w-[140px] truncate">{userEmail}</span>
              </div>
            )}

            <button
              onClick={onOpenImportModal}
              className="inline-flex items-center px-3 py-2 border border-slate-300 text-xs font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition shadow-xs"
              title="CSV/Excel 반입"
            >
              <UploadCloud className="w-4 h-4 mr-1.5 text-slate-500" />
              <span>파일 반입</span>
            </button>

            <button
              onClick={onExportCsv}
              className="inline-flex items-center px-3 py-2 border border-slate-300 text-xs font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition shadow-xs hidden sm:inline-flex"
              title="현재 데이터 CSV 내보내기"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
              <span>내보내기</span>
            </button>

            <button
              onClick={onResetData}
              className="inline-flex items-center px-3 py-2 border border-slate-300 text-xs font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition shadow-xs"
              title="기본 샘플 데이터로 복원"
            >
              <RotateCcw className="w-4 h-4 mr-1.5 text-slate-500" />
              <span className="hidden sm:inline">샘플 복원</span>
            </button>

            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center px-3.5 py-2 border border-transparent text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              <span>견적 등록</span>
            </button>

            <button
              onClick={onLogout}
              className="inline-flex items-center px-2.5 py-2 border border-slate-300 text-xs font-medium rounded-lg text-rose-600 bg-white hover:bg-rose-50 transition shadow-xs"
              title="로그아웃"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

