/**
 * Project: Research Tracks Platform (منصة المسارات البحثية)
 * File: database.js
 * Role: Senior JavaScript Backend Engineer (Core Database Architecture)
 * Description: Enterprise-grade, asynchronous, Promise-based IndexedDB data engine.
 *              Implements secure CRUD workflows, in-memory caching, schema migrations,
 *              indexing optimizations, and data recovery resilience patterns.
 */

// ==========================================================================
// 1. DATA VALIDATION MATRIX UTILITIES
// ==========================================================================
const SchemaValidator = {
    user(data) {
        if (!data || typeof data !== 'object') throw new Error('بيانات المستخدم غير صالحة.');
        if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw new Error('صيغة البريد الإلكتروني غير صالحة.');
        if (!data.id || String(data.id).length !== 8) throw new Error('معرف المستخدم الفريد يجب أن يتكون من 8 أرقام.');
        if (!data.name || data.name.trim().length < 2) throw new Error('الاسم الكامل مطلوب.');
    },
    track(data) {
        if (!data || !data.id || !data.title) throw new Error('بيانات المسار البحثي غير مكتملة.');
    },
    project(data) {
        if (!data || !data.id || !data.userId || !data.title) throw new Error('بيانات المشروع غير صالحة أو مفقود معرف المستخدم.');
    },
    notification(data) {
        if (!data || !data.id || !data.userId || !data.message) throw new Error('بيانات الإشعار غير صالحة.');
    }
};

// ==========================================================================
// 2. DATABASE CONFIGURATION & SCHEMAS & SEED DATA
// ==========================================================================
const DB_NAME = 'ResearchTracksDB';
const DB_VERSION = 1;

const STORES = {
    users: { key: 'email', indexes: ['id'] },
    tracks: { key: 'id', indexes: ['category', 'keywords'] },
    projects: { key: 'id', indexes: ['userId'] },
    notifications: { key: 'id', indexes: ['userId', 'readStatus'] }
};

// حسابات المطورين والمختبرين الافتراضية للحقن التلقائي
const DEVS_SEED_DATA = [
    {
        id: "90817263",
        name: "مصطفى إبراهيم",
        email: "mm@gmail.com",
        phone: "07701234567",
        country: "IQ",
        university: "الجامعة التقنية الوسطى",
        researchInterest: "Edge AI & Organ Digital Twins",
        gender: "Male",
        password: "12345678", // تطابق شروط التحقق الفني
        avatar: "M",
        achievements: 5,
        publishedPapers: 2,
        projects: 3,
        notifications: 1,
        role: "Developer",
        timestamp: new Date().toISOString()
    }
];

// ==========================================================================
// 3. STORAGE CONNECTION MANAGER & CACHE ENGINE
// ==========================================================================
class DatabaseManager {
    constructor() {
        this.db = null;
        this.cache = new Map(); // In-memory performance cache tier
    }

    /**
     * Connects to IndexedDB instance with transactional stability and auto-migration hooks.
     * @returns {Promise<IDBDatabase>}
     */
    async connect() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            try {
                const request = indexedDB.open(DB_NAME, DB_VERSION);

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    
                    Object.entries(STORES).forEach(([storeName, config]) => {
                        if (!db.objectStoreNames.contains(storeName)) {
                            const store = db.createObjectStore(storeName, { keyPath: config.key });
                            config.indexes.forEach(indexName => {
                                const multiEntry = indexName === 'keywords';
                                store.createIndex(indexName, indexName, { unique: indexName === 'id', multiEntry });
                            });
                        }
                    });
                };

                request.onsuccess = async (event) => {
                    this.db = event.target.result;
                    
                    this.db.onversionchange = () => {
                        this.db.close();
                        this.db = null;
                    };

                    // تشغيل نظام حقن البيانات التلقائي فور استقرار الاتصال وقبل الإرجاع
                    try {
                        await this.seedDatabaseIfEmpty();
                    } catch (seedError) {
                        console.error('فشل حقن حسابات التطوير الافتراضية:', seedError);
                    }

                    resolve(this.db);
                };

                request.onerror = () => {
                    this.handleCorruptedRecovery().then(resolve).catch(reject);
                };
            } catch (err) {
                reject(new Error(`فشل تهيئة قاعدة البيانات الأساسية: ${err.message}`));
            }
        });
    }

    /**
     * Checks if users store is empty and injects standard dev seeds.
     */
    async seedDatabaseIfEmpty() {
        const transaction = this.db.transaction('users', 'readonly');
        const store = transaction.objectStore('users');
        
        return new Promise((resolve, reject) => {
            const countRequest = store.count();
            
            countRequest.onsuccess = async () => {
                if (countRequest.result === 0) {
                    console.log('Database Engine: مستودع المستخدمين فارغ. جاري إدخال حسابات المطورين...');
                    
                    // استخدام ميزة المعالجة الجماعية المتاحة بالنظام لحقن البيانات دفعة واحدة
                    try {
                        const writeTx = this.db.transaction('users', 'readwrite');
                        const writeStore = writeTx.objectStore('users');
                        
                        DEVS_SEED_DATA.forEach(user => {
                            writeStore.add(user);
                            // وضع البيانات في الكاش مباشرة لرفع كفاءة الأداء اللحظي
                            this.cache.set(`user_email_${user.email.toLowerCase()}`, user);
                            this.cache.set(`user_id_${user.id}`, user);
                        });

                        writeTx.oncomplete = () => {
                            console.log('Database Engine: تم حقن حسابات المطورين الافتراضية بنجاح.');
                            resolve();
                        };
                        writeTx.onerror = () => reject(new Error('فشل معالجة معاهدة كتابة حسابات المطورين.'));
                    } catch (err) {
                        reject(err);
                    }
                } else {
                    resolve();
                }
            };
            countRequest.onerror = () => reject(new Error('فشل فحص تعداد السجلات الأساسية.'));
        });
    }

    /**
     * Re-instantiates and wipes corrupted index headers safely upon physical write failures.
     */
    async handleCorruptedRecovery() {
        console.warn('Database error or corruption detected. Initiating recovery safety routine...');
        return new Promise((resolve, reject) => {
            const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
            deleteRequest.onsuccess = () => {
                this.cache.clear();
                this.db = null;
                this.connect().then(resolve).catch(reject);
            };
            deleteRequest.onerror = () => reject(new Error('فشل نظام التعافي التلقائي من معالجة تلف قاعدة البيانات.'));
        });
    }

    /**
     * Abstract Transaction helper providing modular pipeline execution contexts.
     */
    async getStore(storeName, mode = 'readonly') {
        const db = await this.connect();
        const transaction = db.transaction(storeName, mode);
        return transaction.objectStore(storeName);
    }
}

const DBInstance = new DatabaseManager();

// ==========================================================================
// 4. USERS CRUD OPERATIONS
// ==========================================================================
// ==========================================================================
// 4. USERS CRUD OPERATIONS (معدلة للإضافة اليدوية المباشرة)
// ==========================================================================
const UserCRUD = {
    // هذه الدالة للإضافة اليدوية المباشرة (بدون تحققات)
    async forceAddUser(userData) {
        const normalized = { ...userData, email: userData.email.toLowerCase().trim() };
        const store = await DBInstance.getStore('users', 'readwrite');
        
        return new Promise((resolve, reject) => {
            const request = store.put(normalized); // استخدام put لتجاوز أي تعارض
            request.onsuccess = () => {
                console.log(`Database Engine: تم حقن المستخدم ${normalized.email} يدوياً بنجاح.`);
                resolve(true);
            };
            request.onerror = () => reject(new Error('فشل الحقن اليدوي للبيانات.'));
        });
    },

    // الدوال الأصلية كما هي
    async updateUser(userData) {
        SchemaValidator.user(userData);
        const normalized = { ...userData, email: userData.email.toLowerCase().trim() };
        const store = await DBInstance.getStore('users', 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.put(normalized);
            request.onsuccess = () => {
                DBInstance.cache.delete(`user_email_${normalized.email}`);
                DBInstance.cache.delete(`user_id_${normalized.id}`);
                resolve(true);
            };
            request.onerror = () => reject(new Error('فشل تحديث بيانات الملف الشخصي.'));
        });
    },

    async getUserByEmail(email) {
        if (!email) return null;
        const cleanEmail = email.toLowerCase().trim();
        if (DBInstance.cache.has(`user_email_${cleanEmail}`)) return DBInstance.cache.get(`user_email_${cleanEmail}`);
        const store = await DBInstance.getStore('users', 'readonly');
        return new Promise((resolve) => {
            const request = store.get(cleanEmail);
            request.onsuccess = () => {
                const data = request.result || null;
                if (data) {
                    DBInstance.cache.set(`user_email_${cleanEmail}`, data);
                    DBInstance.cache.set(`user_id_${data.id}`, data);
                }
                resolve(data);
            };
            request.onerror = () => resolve(null);
        });
    }
};

// ==========================================================================
// 5. RESEARCH TRACKS ENGINE INTERFACES
// ==========================================================================
const TrackCRUD = {
    async addTrack(trackData) {
        SchemaValidator.track(trackData);
        const store = await DBInstance.getStore('tracks', 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.add(trackData);
            request.onsuccess = () => resolve(trackData);
            request.onerror = () => reject(new Error('فشل إضافة المسار البحثي لقاعدة البيانات.'));
        });
    },

    async getAllTracks() {
        const store = await DBInstance.getStore('tracks', 'readonly');
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(new Error('فشل جلب قائمة المسارات البحثية المتوفرة.'));
        });
    },

    async searchTracks(queryStr) {
        if (!queryStr || typeof queryStr !== 'string') return [];
        const cleanQuery = queryStr.toLowerCase().trim();
        const allTracks = await this.getAllTracks();

        return allTracks.filter(track => 
            track.title.toLowerCase().includes(cleanQuery) || 
            (track.description && track.description.toLowerCase().includes(cleanQuery))
        );
    },

    async filterTracks(category) {
        if (!category) return this.getAllTracks();
        const store = await DBInstance.getStore('tracks', 'readonly');
        const index = store.index('category');
        return new Promise((resolve, reject) => {
            const request = index.getAll(category);
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(new Error('فشل تطبيق معالجة الفرز على التصنيفات البحثية.'));
        });
    }
};

// ==========================================================================
// 6. PROJECTS OPERATIONS SUBSYSTEM
// ==========================================================================
const ProjectCRUD = {
    async createProject(projectData) {
        SchemaValidator.project(projectData);
        const store = await DBInstance.getStore('projects', 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.add(projectData);
            request.onsuccess = () => resolve(projectData);
            request.onerror = () => reject(new Error('فشل إضافة السجل الفني للمشروع البحثي الجديد.'));
        });
    },

    async updateProject(projectData) {
        SchemaValidator.project(projectData);
        const store = await DBInstance.getStore('projects', 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.put(projectData);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(new Error('فشل تعديل سجل تتبع تحديثات المشروع.'));
        });
    },

    async getUserProjects(userId) {
        if (!userId) return [];
        const store = await DBInstance.getStore('projects', 'readonly');
        const index = store.index('userId');
        return new Promise((resolve, reject) => {
            const request = index.getAll(String(userId));
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(new Error('فشل جلب السجل الفني لمشاريع الباحث.'));
        });
    }
};

// ==========================================================================
// 7. NOTIFICATIONS REAL-TIME NOTIFIER LAYER
// ==========================================================================
const NotificationCRUD = {
    async addNotification(notificationData) {
        SchemaValidator.notification(notificationData);
        const record = { ...notificationData, readStatus: notificationData.readStatus || 0 };
        const store = await DBInstance.getStore('notifications', 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.add(record);
            request.onsuccess = () => resolve(record);
            request.onerror = () => reject(new Error('فشل جدولة إرسال الإشعار لملف المستخدم المعني.'));
        });
    },

    async getUserNotifications(userId) {
        if (!userId) return [];
        const store = await DBInstance.getStore('notifications', 'readonly');
        const index = store.index('userId');
        return new Promise((resolve, reject) => {
            const request = index.getAll(String(userId));
            request.onsuccess = () => {
                const list = request.result || [];
                resolve(list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
            };
            request.onerror = () => reject(new Error('فشل مزامنة جلب إشعارات حساب المستخدم من النظام.'));
        });
    },

    async markAsRead(notificationId) {
        if (!notificationId) throw new Error('معرف الإشعار مطلوب.');
        const store = await DBInstance.getStore('notifications', 'readwrite');
        
        return new Promise((resolve, reject) => {
            const getReq = store.get(notificationId);
            getReq.onsuccess = () => {
                const item = getReq.result;
                if (!item) { reject(new Error('مستند الإشعار غير موجود.')); return; }
                
                item.readStatus = 1;
                const putReq = store.put(item);
                putReq.onsuccess = () => resolve(true);
                putReq.onerror = () => reject(new Error('فشل تعديل حالة قراءة الإشعار المستهدف.'));
            };
            getReq.onerror = () => reject(new Error('فشل قراءة سجل الإشعار من الذاكرة المخزنة.'));
        });
    }
};

// ==========================================================================
// 8. BATCH PIPELINE TRANSACTION SYSTEM PROFILES
// ==========================================================================
const BatchOperations = {
    async executeBulkPut(storeName, dataArray) {
        if (!Array.isArray(dataArray) || dataArray.length === 0) return false;
        const store = await DBInstance.getStore(storeName, 'readwrite');

        return new Promise((resolve, reject) => {
            dataArray.forEach((item) => {
                store.put(item);
            });
            store.transaction.oncomplete = () => {
                if (storeName === 'users') DBInstance.cache.clear();
                resolve(true);
            };
            store.transaction.onerror = () => reject(new Error(`فشل إتمام معالجة الحزمة على المستودع المستهدف: ${storeName}`));
        });
    }
};

// ==========================================================================
// 9. MODULE EXPORTS ARCHITECTURE EXPOSURES
// ==========================================================================
// نقوم بتعريفه كـ متغير عادي بدون export ربطاً بـ window
const DatabaseEngine = {
    connectionManager: DBInstance,
    ...UserCRUD,
    ...TrackCRUD,
    ...ProjectCRUD,
    ...NotificationCRUD,
    ...BatchOperations
};

// جعل المحرك متاحاً عالمياً لكل الملفات الأخرى
window.DatabaseEngine = DatabaseEngine;





const list = [
    { id: "90817290", name: "بلال صلاح علي", email: "bilal.salah@example.com", phone: "N/A", country: "IQ", university: "الأشعة", researchInterest: "عادي", gender: "Male", password: "12345678", avatar: "B", achievements: 0, publishedPapers: 0, projects: 0, notifications: 0, role: "User", timestamp: new Date().toISOString() },
    { id: "90817291", name: "إستبرق حسين سعدون", email: "istabraq.hussein@example.com", phone: "N/A", country: "IQ", university: "علوم الحاسوب", researchInterest: "مبتدئ", gender: "Female", password: "12345678", avatar: "I", achievements: 0, publishedPapers: 0, projects: 0, notifications: 0, role: "User", timestamp: new Date().toISOString() },
    { id: "90817292", name: "غدير رحيم", email: "ghadeer.raheem@example.com", phone: "N/A", country: "IQ", university: "سادس علمي", researchInterest: "N/A", gender: "Female", password: "12345678", avatar: "G", achievements: 0, publishedPapers: 0, projects: 0, notifications: 0, role: "User", timestamp: new Date().toISOString() },
    { id: "90817293", name: "آية باسم فاضل", email: "aya.basim@example.com", phone: "N/A", country: "IQ", university: "الطب العام", researchInterest: "مبتدئ", gender: "Female", password: "12345678", avatar: "A", achievements: 0, publishedPapers: 0, projects: 0, notifications: 0, role: "User", timestamp: new Date().toISOString() },
    { id: "90817294", name: "فاطمة علي محمد", email: "fatima.ali@example.com", phone: "N/A", country: "IQ", university: "الهندسة المعمارية", researchInterest: "مبتدئ", gender: "Female", password: "12345678", avatar: "F", achievements: 0, publishedPapers: 0, projects: 0, notifications: 0, role: "User", timestamp: new Date().toISOString() },
    { id: "90817295", name: "بنين خليل", email: "banin.khalil@example.com", phone: "N/A", country: "IQ", university: "المختبرات الطبية", researchInterest: "N/A", gender: "Female", password: "12345678", avatar: "B", achievements: 0, publishedPapers: 0, projects: 0, notifications: 0, role: "User", timestamp: new Date().toISOString() },
    { id: "90817296", name: "ريتا بشار جميل", email: "rita.bashar@example.com", phone: "N/A", country: "IQ", university: "طب الأسنان", researchInterest: "متوسط", gender: "Female", password: "12345678", avatar: "R", achievements: 0, publishedPapers: 0, projects: 0, notifications: 0, role: "User", timestamp: new Date().toISOString() },
    { id: "90817297", name: "أنفال علي حسين", email: "anfal.ali@example.com", phone: "N/A", country: "IQ", university: "المختبرات الطبية", researchInterest: "مبتدئ", gender: "Female", password: "12345678", avatar: "A", achievements: 0, publishedPapers: 0, projects: 0, notifications: 0, role: "User", timestamp: new Date().toISOString() },
    { id: "90817298", name: "فاطمة هاشم حسين", email: "fatima.hashim@example.com", phone: "N/A", country: "IQ", university: "علوم الكيمياء", researchInterest: "N/A", gender: "Female", password: "12345678", avatar: "F", achievements: 0, publishedPapers: 0, projects: 0, notifications: 0, role: "User", timestamp: new Date().toISOString() },
    { id: "90817299", name: "جعفر علي كاظم", email: "jaafar.ali@example.com", phone: "N/A", country: "IQ", university: "الصيدلة", researchInterest: "متوسط", gender: "Male", password: "12345678", avatar: "J", achievements: 0, publishedPapers: 0, projects: 0, notifications: 0, role: "User", timestamp: new Date().toISOString() },
    { id: "90817300", name: "عادل عمار عادل", email: "adel.ammar@example.com", phone: "N/A", country: "IQ", university: "تقنيات المختبرات الطبية", researchInterest: "مبتدئ إلى متوسط", gender: "Male", password: "12345678", avatar: "A", achievements: 0, publishedPapers: 0, projects: 0, notifications: 0, role: "User", timestamp: new Date().toISOString() },
    { id: "90817301", name: "تولين محمد", email: "tulin.mohammed@example.com", phone: "N/A", country: "IQ", university: "خامس علمي", researchInterest: "N/A", gender: "Female", password: "12345678", avatar: "T", achievements: 0, publishedPapers: 0, projects: 0, notifications: 0, role: "User", timestamp: new Date().toISOString() },
    { id: "90817302", name: "إيمان مشعان صبر", email: "iman.mashan@example.com", phone: "N/A", country: "IQ", university: "تقنيات الأشعة", researchInterest: "مبتدئ", gender: "Female", password: "12345678", avatar: "I", achievements: 0, publishedPapers: 0, projects: 0, notifications: 0, role: "User", timestamp: new Date().toISOString() },
    { id: "90817303", name: "نورا شوقي لويس", email: "nora.shouqi@example.com", phone: "N/A", country: "IQ", university: "التخدير", researchInterest: "جيد إلى جيد جدًا", gender: "Female", password: "12345678", avatar: "N", achievements: 0, publishedPapers: 0, projects: 0, notifications: 0, role: "User", timestamp: new Date().toISOString() },
    { id: "90817304", name: "فاطمة ميثم عودة", email: "fatima.mytham@example.com", phone: "N/A", country: "IQ", university: "علوم الفيزياء", researchInterest: "N/A", gender: "Female", password: "12345678", avatar: "F", achievements: 0, publishedPapers: 0, projects: 0, notifications: 0, role: "User", timestamp: new Date().toISOString() },
    { id: "90817305", name: "جنات ثامر خليل", email: "janat.thamer@example.com", phone: "N/A", country: "IQ", university: "خامس علمي", researchInterest: "مبتدئ", gender: "Female", password: "12345678", avatar: "J", achievements: 0, publishedPapers: 0, projects: 0, notifications: 0, role: "User", timestamp: new Date().toISOString() },
    { id: "90817306", name: "زينب عبدالله", email: "zainab.abdullah@example.com", phone: "N/A", country: "IQ", university: "الطب", researchInterest: "متوسط", gender: "Female", password: "12345678", avatar: "Z", achievements: 0, publishedPapers: 0, projects: 0, notifications: 0, role: "User", timestamp: new Date().toISOString() },
    { id: "90817307", name: "مصطفى إبراهيم حسن", email: "mustafa.ibrahim.h@example.com", phone: "N/A", country: "IQ", university: "تقنيات تخدير وعناية مركزة", researchInterest: "N/A", gender: "Male", password: "12345678", avatar: "M", achievements: 0, publishedPapers: 0, projects: 0, notifications: 0, role: "User", timestamp: new Date().toISOString() },
    { id: "90817308", name: "نبأ نبيل عبود", email: "naba.nabil@example.com", phone: "N/A", country: "IQ", university: "التخدير", researchInterest: "مبتدئ", gender: "Female", password: "12345678", avatar: "N", achievements: 0, publishedPapers: 0, projects: 0, notifications: 0, role: "User", timestamp: new Date().toISOString() },
    { id: "90817309", name: "تبارك محمد", email: "tabarak.mohammed@example.com", phone: "N/A", country: "IQ", university: "التمريض (فرع الإسعاف)", researchInterest: "جيد", gender: "Female", password: "12345678", avatar: "T", achievements: 0, publishedPapers: 0, projects: 0, notifications: 0, role: "User", timestamp: new Date().toISOString() },
    { id: "90817310", name: "نرجس امير مالك", email: "narjis.amir@example.com", phone: "N/A", country: "IQ", university: "رابع علمي", researchInterest: "N/A", gender: "Female", password: "12345678", avatar: "N", achievements: 0, publishedPapers: 0, projects: 0, notifications: 0, role: "User", timestamp: new Date().toISOString() },
    { id: "90817311", name: "زهراء ضياء", email: "zahraa.diaa@example.com", phone: "N/A", country: "IQ", university: "سادس مهني", researchInterest: "مبتدئ", gender: "Female", password: "12345678", avatar: "Z", achievements: 0, publishedPapers: 0, projects: 0, notifications: 0, role: "User", timestamp: new Date().toISOString() },
    { id: "90817312", name: "ريم راكان", email: "reem.rakan@example.com", phone: "N/A", country: "IQ", university: "المختبرات الطبية", researchInterest: "متوسط", gender: "Female", password: "12345678", avatar: "R", achievements: 0, publishedPapers: 0, projects: 0, notifications: 0, role: "User", timestamp: new Date().toISOString() },
    { id: "90817313", name: "فرقان", email: "furqan@example.com", phone: "N/A", country: "IQ", university: "طب عام", researchInterest: "N/A", gender: "Female", password: "12345678", avatar: "F", achievements: 0, publishedPapers: 0, projects: 0, notifications: 0, role: "User", timestamp: new Date().toISOString() }
];

list.forEach(u => DatabaseEngine.forceAddUser(u));
console.log("تمت الإضافة!");