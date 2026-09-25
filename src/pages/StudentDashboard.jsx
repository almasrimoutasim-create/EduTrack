import React, { useState } from 'react';
import { 
  Home, 
  Video, 
  Calendar, 
  BookOpen, 
  CheckSquare, 
  LogOut, 
  Menu, 
  Bell 
} from 'lucide-react';

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // عناصر القائمة الجانبية
  const menuItems = [
    { id: 'overview', label: 'الرئيسية', icon: Home },
    { id: 'virtual-class', label: 'الفصل الافتراضي', icon: Video },
    { id: 'schedule', label: 'الجدول الدراسي', icon: Calendar },
    { id: 'library', label: 'المكتبة الرقمية', icon: BookOpen },
    { id: 'assignments', label: 'الواجبات والاختبارات', icon: CheckSquare },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-right" dir="rtl">
      
      {/* القائمة الجانبية (Sidebar) */}
      <aside className={`bg-slate-900 text-white w-64 space-y-6 py-7 px-4 absolute inset-y-0 right-0 transform ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out z-20 shadow-lg`}>
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold tracking-wide text-blue-400">منصتي التعليمية</h2>
        </div>

        <nav className="mt-10 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                  activeTab === item.id 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-6 right-4 left-4">
          <button 
            onClick={() => alert('تسجيل الخروج')}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-400 hover:bg-slate-800 transition-colors text-sm font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* محتوى الصفحة الرئيسي */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* شريط العلو (Header) */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 z-10">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-gray-600 focus:outline-none"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4">
            <span className="font-semibold text-gray-800">مرحباً بك، معتصم</span>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              م
            </div>
          </div>
        </header>

        {/* عرض المحتوى حسب التبويب النشط */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-4">لوحة التحكم</h1>
              <p className="text-gray-600">اختر من القائمة الجانبية للانتقال إلى الفصول الافتراضية، الجدول، المكتبة، أو الواجبات.</p>
            </div>
          )}

          {activeTab === 'virtual-class' && (
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-4">الفصول الافتراضية</h1>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-600">لا توجد فصول افتراضية جارية في الوقت الحالي.</p>
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-4">الجدول الدراسي</h1>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-600">عرض الجدول الأسبوعي للحصص والمحاضرات.</p>
              </div>
            </div>
          )}

          {activeTab === 'library' && (
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-4">المكتبة الرقمية</h1>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-600">الكتب، المراجع، والملفات التعليمية المتاحة للتحميل.</p>
              </div>
            </div>
          )}

          {activeTab === 'assignments' && (
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-4">الواجبات والاختبارات</h1>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-600">قائمة الواجبات المطلوبة ومواعيد تسليمها.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
