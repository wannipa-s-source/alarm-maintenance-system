/**
 * Design System ของ "โครงหน้าเว็บ" — Header, Navigation Bar และ Role Notice
 *
 * หลักการ:
 * 1. โทน Navy + Blue + สีประจำ Role ให้เข้ากันทั้งหน้า
 * 2. ทุกพื้นผิวเป็น "สีทึบ" (solid) เต็มพื้นที่ ไม่มีความโปร่งใส ไม่มี gradient
 * 3. เปลี่ยนสีตามโหมดสว่าง/มืดอัตโนมัติ โดยใช้คลาส `chrome-*` ที่ผูกกับ CSS variable
 *    (ประกาศไว้ที่ app/globals.css ทั้งชุดค่า light และ dark) — ไม่ต้องเขียน `dark:` ซ้ำในทุกไฟล์
 *    - โหมดสว่าง: พื้นขาว #FFFFFF + ตัวอักษรเข้ม
 *    - โหมดมืด:  พื้น Navy #0F172A + ตัวอักษรสว่าง
 * 4. เมนู/ปุ่มที่ "กำลังเลือก" ใช้สี brand แบบทึบเหมือนกันทั้งสองโหมด
 *    ตัวอักษรและไอคอนสีขาว ส่วนสถานะอื่นใช้โทน chrome จาง ๆ เพื่อไม่ให้แย่งความสนใจ
 *
 * (ไฟล์นี้มีแต่คลาส Tailwind เท่านั้น ไม่มี logic / routing / permission)
 */

/** พื้นผิวของแถบด้านบน (Header) และแถบเมนู — สีทึบ เปลี่ยนตามโหมด */
export const BAR = {
  /** แถบเต็มความกว้าง พื้นทึบ เต็มพื้นที่ (ขาวในโหมดสว่าง / Navy ในโหมดมืด) ไม่มี backdrop-blur */
  surface: 'bg-chrome',
  /** เส้นคั่นบาง ๆ ระหว่างแถบ เพื่อแยกแถบออกจากกัน */
  line: 'border-b border-chrome-line',
  /** เงาบางมากใต้แถบ (ค่าต่างกันตามโหมด) ให้เหมือนแถบควบคุมของระบบ Dashboard */
  shadow: 'shadow-[var(--chrome-shadow)]',
} as const;

/** เมนูในแถบนำทาง */
export const MENU = {
  /** เมนูที่กำลังเลือก: พื้นน้ำเงินทึบ + ตัวอักษร/ไอคอนสีขาว (เหมือนกันทั้งสองโหมด) */
  active: 'bg-brand text-white hover:bg-brand-hover',
  /** เมนูที่ยังไม่ได้เลือก: พื้นกลมกลืนกับแถบ แต่ hover แล้วขึ้นเป็นพื้นทึบที่อ่อนลง */
  inactive: 'text-chrome-muted hover:bg-chrome-raised hover:text-chrome-text',
  /** รูปร่างปุ่มเมนู (ใช้ร่วมกันทั้ง active / inactive) */
  shape: 'flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap',
  /** รูปร่างปุ่มเมนูบนมือถือ */
  shapeMobile: 'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
  /** เมนูบนมือถือที่ยังไม่เลือก: พื้นทึบ + เส้นขอบ */
  mobileIdle: 'bg-chrome-raised border border-chrome-outline text-chrome-text hover:bg-chrome-outline',
  /** คำอธิบายเมนูบนมือถือ (เมนูที่เลือก) */
  hintActive: 'text-brand-soft',
  /** คำอธิบายเมนูบนมือถือ (เมนูที่ยังไม่เลือก) */
  hintInactive: 'text-chrome-muted',
} as const;

/** ปุ่ม/ตัวควบคุมขนาดเล็กที่อยู่บนแถบ (Header) */
export const CONTROL = {
  /** รูปร่างปุ่ม (คลาสสีมาเติมจาก `default` หรือ `danger` เท่านั้น เพื่อไม่ให้คลาสสีซ้ำซ้อนกัน) */
  shape: 'inline-flex items-center justify-center rounded-xl border transition-all duration-200 active:scale-95',
  /** ปุ่มมาตรฐานบนแถบ: พื้นทึบ เปลี่ยนตามโหมด */
  default: 'bg-chrome-raised border-chrome-outline text-chrome-text hover:bg-chrome-outline',
  /** ปุ่มที่แยกความหมายออกไป (ออกจากระบบ) */
  danger:
    'bg-chrome-raised border-rose-300 text-rose-600 hover:bg-chrome-outline hover:text-rose-500 dark:border-rose-500 dark:text-rose-400 dark:hover:text-rose-300',
} as const;

/** โลโก้และชื่อระบบในแถบ Header */
export const BRANDMARK = {
  /** กล่องโลโก้: พื้น brand ทึบ ไม่มี gradient (สีเดียวกันทั้งสองโหมด) */
  box: 'w-8 h-8 rounded-lg bg-brand border border-brand-hover text-white flex items-center justify-center shrink-0',
  /** ชื่อระบบ: สีทึบ ไม่มี gradient */
  title: 'text-sm sm:text-base md:text-lg font-extrabold text-chrome-text',
  /** ชื่อระบบย่อย */
  subtitle: 'hidden sm:block text-[10px] md:text-[11px] font-semibold tracking-wide text-chrome-muted',
} as const;

/**
 * สีประจำบทบาท — ใช้สีเดียวกันทุกบทบาท (Admin / Technician / Viewer)
 * ใช้ทั้งกับ "แถบ Role Notice" และ "ป้ายบทบาทใน Header" ให้ตรงกันทั้ง 6 จุด
 * พื้นเป็นสีทึบ ไม่มี gradient / transparency / opacity และตัวอักษร+จุดเป็นสีขาว
 */
export const ROLE_COLOR = {
  /** พื้นของแถบ Role Notice และพื้นของป้ายบทบาท (เหมือนกันทุก Role) */
  surface: 'bg-role',
  /** ตัวอักษรและจุดนำหน้าในป้ายบทบาท */
  on: 'text-white',
  /** จุดกลมขนาดเล็กในป้ายบทบาท */
  dot: 'bg-white',
} as const;
