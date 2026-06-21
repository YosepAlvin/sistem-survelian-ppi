import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting enhanced seeding...')

  // 1. Create Roles
  const adminRole = await prisma.role.upsert({
    where: { slug: 'admin' },
    update: {},
    create: {
      name: 'Admin',
      slug: 'admin',
      permissions: JSON.stringify(['manage_users', 'manage_roles', 'manage_ruangan', 'manage_dokter', 'manage_diagnosa']),
    },
  })

  const ipcnRole = await prisma.role.upsert({
    where: { slug: 'ipcn' },
    update: {},
    create: {
      name: 'IPCN',
      slug: 'ipcn',
      permissions: JSON.stringify(['view_dashboard', 'verify_infeksi', 'monitor_device_day', 'export_laporan']),
    },
  })

  const ipclnRole = await prisma.role.upsert({
    where: { slug: 'ipcln' },
    update: {},
    create: {
      name: 'IPCLN',
      slug: 'ipcln',
      permissions: JSON.stringify(['input_pasien', 'input_surveilans_harian', 'input_operasi', 'input_antibiotik', 'input_infeksi']),
    },
  })

  // 2. Create Wards (Ruangan)
  const wards = [
    { nama: 'ICU (Intensive Care Unit)', kode: 'ICU', jenis: 'ICU' },
    { nama: 'Mawar (Rawat Inap Umum)', kode: 'MWR', jenis: 'GENERAL' },
    { nama: 'Melati (Kebidanan)', kode: 'MLT', jenis: 'GENERAL' },
    { nama: 'NICU (Neonatal ICU)', kode: 'NICU', jenis: 'NICU' },
    { nama: 'OK (Operatie Kamer)', kode: 'OK', jenis: 'OK' },
  ]

  const createdWards = []
  for (const ward of wards) {
    const w = await prisma.ruangan.upsert({
      where: { kode: ward.kode },
      update: {},
      create: ward,
    })
    createdWards.push(w)
  }

  const icuWard = createdWards.find(w => w.kode === 'ICU')!
  const mawarWard = createdWards.find(w => w.kode === 'MWR')!

  // 3. Create Doctors
  const doctors = [
    { nama: 'Dr. Budi Santoso, Sp.PD', spesialisasi: 'Penyakit Dalam' },
    { nama: 'Dr. Siti Aminah, Sp.A', spesialisasi: 'Anak' },
    { nama: 'Dr. Ahmad Fauzi, Sp.An', spesialisasi: 'Anestesi' },
  ]

  const createdDoctors = []
  for (const doc of doctors) {
    const d = await prisma.dokter.create({ data: doc })
    createdDoctors.push(d)
  }

  // 4. Create Diagnoses
  const diagnoses = [
    { kode_icd: 'A01', nama: 'Typhoid Fever', kategori: 'Infectious' },
    { kode_icd: 'J18', nama: 'Pneumonia', kategori: 'Respiratory' },
    { kode_icd: 'N39', nama: 'Urinary Tract Infection', kategori: 'Urology' },
    { kode_icd: 'I64', nama: 'Stroke', kategori: 'Neurology' },
  ]

  const createdDiagnoses = []
  for (const dx of diagnoses) {
    const d = await prisma.diagnosa.upsert({
      where: { kode_icd: dx.kode_icd },
      update: {},
      create: dx,
    })
    createdDiagnoses.push(d)
  }

  // 5. Create Users
  const hashedPassword = await bcryptjs.hash('admin123', 10)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@rs.com' },
    update: {},
    create: {
      name: 'Administrator Utama',
      email: 'admin@rs.com',
      password: hashedPassword,
      roleId: adminRole.id,
      isActive: true,
    },
  })

  const ipcnUser = await prisma.user.upsert({
    where: { email: 'ipcn@rs.com' },
    update: {},
    create: {
      name: 'Hj. Ratna Sari, S.Kep, Ns (IPCN)',
      email: 'ipcn@rs.com',
      password: hashedPassword,
      roleId: ipcnRole.id,
      isActive: true,
    },
  })

  const ipclnIcu = await prisma.user.upsert({
    where: { email: 'ipcln.icu@rs.com' },
    update: {},
    create: {
      name: 'Ns. Ahmad Icu (IPCLN ICU)',
      email: 'ipcln.icu@rs.com',
      password: hashedPassword,
      roleId: ipclnRole.id,
      ruanganId: icuWard.id,
      isActive: true,
    },
  })

  const ipclnMawar = await prisma.user.upsert({
    where: { email: 'ipcln.mawar@rs.com' },
    update: {},
    create: {
      name: 'Ns. Sinta Mawar (IPCLN Mawar)',
      email: 'ipcln.mawar@rs.com',
      password: hashedPassword,
      roleId: ipclnRole.id,
      ruanganId: mawarWard.id,
      isActive: true,
    },
  })

  // 6. Create Patients & Admissions
  const today = new Date()
  today.setHours(10, 0, 0, 0)
  
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 7)
  
  const patientsData = [
    { no_rm: '11-22-33', nama: 'Tn. Slamet Raharjo', tgl_lahir: new Date(1965, 4, 12), jk: 'Laki-laki', alamat: 'Jl. Pemuda No. 45, Pekalongan' },
    { no_rm: '44-55-66', nama: 'Ny. Aminah Suyuti', tgl_lahir: new Date(1978, 8, 23), jk: 'Perempuan', alamat: 'Kraton Kidul, Pekalongan Barat' },
    { no_rm: '77-88-99', nama: 'An. Rizky Pratama', tgl_lahir: new Date(2015, 1, 10), jk: 'Laki-laki', alamat: 'Perumahan Binagriya B3/12' },
  ]

  for (let i = 0; i < patientsData.length; i++) {
    const p = await prisma.pasien.upsert({
      where: { no_rm: patientsData[i].no_rm },
      update: {},
      create: {
        no_rm: patientsData[i].no_rm,
        nama: patientsData[i].nama,
        tanggal_lahir: patientsData[i].tgl_lahir,
        jenis_kelamin: patientsData[i].jk,
        alamat: patientsData[i].alamat,
      }
    })

    // Admission
    const ri = await prisma.rawatInap.create({
      data: {
        pasien_id: p.id,
        ruangan_id: i === 0 ? icuWard.id : mawarWard.id,
        dokter_id: createdDoctors[i % createdDoctors.length].id,
        diagnosa_id: createdDiagnoses[i % createdDiagnoses.length].id,
        tanggal_masuk: sevenDaysAgo,
        status: 'AKTIF',
      }
    })

    // Devices & Surveillance
    if (i === 0) { // Pasien 1: Alat Terpasang (ICU)
      await prisma.alatTerpasang.createMany({
        data: [
          { rawat_inap_id: ri.id, jenis_alat: 'Ventilator', tanggal_pasang: sevenDaysAgo, masih_terpasang: true, device_day: 7 },
          { rawat_inap_id: ri.id, jenis_alat: 'Urine kateter', tanggal_pasang: sevenDaysAgo, masih_terpasang: true, device_day: 7 }
        ]
      })

      // Alert Alat hari ini
      await prisma.notification.create({
        data: {
          type: 'DEVICE_ALERT',
          category: 'WARNING',
          title: 'Evaluasi Alat Terpasang',
          message: `Ventilator pada pasien ${p.nama} sudah terpasang selama 7 hari.`,
          pasienId: p.id,
          createdAt: today
        }
      })
    } 
    
    if (i === 1) { // Pasien 2: Terinfeksi (Mawar)
      await prisma.alatTerpasang.create({
        data: {
          rawat_inap_id: ri.id,
          jenis_alat: 'Vena perifer',
          tanggal_pasang: sevenDaysAgo,
          masih_terpasang: true,
          device_day: 7
        }
      })

      // Kejadian Infeksi hari ini agar muncul di "Kasus Aktif" dashboard
      await prisma.kejadianInfeksi.create({
        data: {
          rawat_inap_id: ri.id,
          jenis_infeksi: 'PLEBITIS',
          tanggal_kejadian: today,
          hari_ke: 7,
          status: 'AKTIF',
          status_verifikasi: 'PENDING',
          created_by: ipclnMawar.id,
        }
      })
    }

    if (i === 2) { // Pasien 3: Ganti Alat (Mawar)
      const fourDaysAgo = new Date(today)
      fourDaysAgo.setDate(today.getDate() - 4)

      // Alat lama dilepas
      await prisma.alatTerpasang.create({
        data: {
          rawat_inap_id: ri.id,
          jenis_alat: 'Vena perifer',
          tanggal_pasang: sevenDaysAgo,
          tanggal_lepas: fourDaysAgo,
          masih_terpasang: false,
          device_day: 3
        }
      })
      
      // Alat baru dipasang
      await prisma.alatTerpasang.create({
        data: {
          rawat_inap_id: ri.id,
          jenis_alat: 'Vena perifer',
          tanggal_pasang: fourDaysAgo,
          masih_terpasang: true,
          device_day: 4
        }
      })

      // Audit trail ganti alat
      await prisma.auditTrail.createMany({
        data: [
          {
            action: 'REMOVE_DEVICE',
            moduleName: 'surveilans',
            userId: ipclnMawar.id,
            userName: ipclnMawar.name,
            entityType: 'AlatTerpasang',
            newValue: 'Dilepas (Ganti Baru)',
            timestamp: fourDaysAgo
          },
          {
            action: 'INSTALL_DEVICE',
            moduleName: 'surveilans',
            userId: ipclnMawar.id,
            userName: ipclnMawar.name,
            entityType: 'AlatTerpasang',
            newValue: 'Terpasang Baru',
            timestamp: fourDaysAgo
          }
        ]
      })

      // Tambahkan Kasus Ditutup Hari Ini
      const closedInfection = await prisma.kejadianInfeksi.create({
        data: {
          rawat_inap_id: ri.id,
          jenis_infeksi: 'ISK',
          tanggal_kejadian: sevenDaysAgo,
          tanggal_selesai: today,
          status: 'SELESAI',
          status_verifikasi: 'VERIFIED',
          hari_ke: 1,
          created_by: ipclnMawar.id,
          verified_by: ipcnUser.id,
          verified_at: today
        }
      })
    }

    // Historical Surveillance
    for (let day = 0; day <= 7; day++) {
      const surveyDate = new Date(sevenDaysAgo)
      surveyDate.setDate(sevenDaysAgo.getDate() + day)
      
      await prisma.surveilansHarian.create({
        data: {
          rawat_inap_id: ri.id,
          tanggal: surveyDate,
          suhu: 36.5 + (Math.random() * 2),
          ivl_terpasang: i >= 1,
          uc_terpasang: i === 0,
          ventilator_terpasang: i === 0,
          ipcln_id: i === 0 ? ipclnIcu.id : ipclnMawar.id,
          ada_infeksi: i === 1 && day === 7,
          status: 'VERIFIED',
          verified_at: surveyDate,
          verified_by: ipcnUser.id
        }
      })
    }
  }

  // 7. Create Threshold Config
  const thresholds = [
    { jenisAlat: 'Vena sentra', hariThreshold: 14 },
    { jenisAlat: 'Vena perifer', hariThreshold: 3 },
    { jenisAlat: 'Arteri', hariThreshold: 7 },
    { jenisAlat: 'Umbilikai', hariThreshold: 7 },
    { jenisAlat: 'Urine kateter', hariThreshold: 7 },
    { jenisAlat: 'Suprapubik kateter', hariThreshold: 7 },
    { jenisAlat: 'Ventilator', hariThreshold: 14 },
    { jenisAlat: 'Endotracheal Tube (ETT)', hariThreshold: 14 },
    { jenisAlat: 'Trakeostomi', hariThreshold: 21 },
    { jenisAlat: 'Nasogastric Tube (NGT)', hariThreshold: 30 },
    { jenisAlat: 'Drain operasi', hariThreshold: 14 },
    { jenisAlat: 'Chest tube (WSD)', hariThreshold: 14 },
  ]

  for (const t of thresholds) {
    await prisma.deviceThresholdConfig.upsert({
      where: { jenisAlat: t.jenisAlat },
      update: { hariThreshold: t.hariThreshold },
      create: t
    })
  }

  console.log('✅ Fresh test data seeded successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
