package com.example.sucessoedu

import com.example.sucessoedu.data.model.AttendanceRecord
import com.example.sucessoedu.data.model.AttendanceStatus
import com.example.sucessoedu.data.model.GradeRecord
import com.example.sucessoedu.data.model.Student
import com.example.sucessoedu.data.model.StudentStatus
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SchoolModelsAndCalculationsTest {

    @Test
    fun testGradeRecordAverageCalculation() {
        val gradeRecord = GradeRecord(
            id = "grd-1",
            studentId = "std-1",
            studentName = "Lucas Gabriel da Silva",
            classId = "cls-1",
            subject = "Matemática",
            b1Grade = 8.0,
            b2Grade = 7.0,
            b3Grade = 9.0,
            b4Grade = 8.0
        )

        assertEquals(8.0, gradeRecord.average, 0.01)
        assertTrue(gradeRecord.isApproved)
    }

    @Test
    fun testGradeRecordRecoveryImprovement() {
        val gradeRecord = GradeRecord(
            id = "grd-2",
            studentId = "std-2",
            studentName = "Aluno Exemplo",
            classId = "cls-1",
            subject = "Física",
            b1Grade = 4.0,
            b2Grade = 4.0,
            b3Grade = 5.0,
            b4Grade = 5.0,
            recoveryGrade = 7.0
        )

        // Initial average was 4.5; recovery grade is 7.0 => should replace lowest grades or improve average
        assertTrue(gradeRecord.average > 4.5)
    }

    @Test
    fun testStudentDropoutRiskFlag() {
        val student = Student(
            id = "std-1",
            name = "Lucas Gabriel da Silva",
            enrollmentNumber = "MAT-2026-001",
            cpf = "123.456.789-00",
            birthDate = "2010-04-15",
            phone = "(11) 98765-4321",
            guardianName = "Maria da Silva",
            guardianPhone = "(11) 98765-4320",
            classId = "cls-1",
            className = "6º Ano A",
            gradeLevel = "6º Ano Fundamental",
            status = StudentStatus.ACTIVE,
            dropoutRisk = true,
            specialCondition = "AEE - Baixa Visão",
            address = "Rua das Flores, 123",
            notes = "Requer material ampliado"
        )

        assertTrue(student.dropoutRisk)
        assertEquals("AEE - Baixa Visão", student.specialCondition)
    }

    @Test
    fun testAttendanceStatusPresence() {
        val record = AttendanceRecord(
            id = "att-1",
            studentId = "std-1",
            classId = "cls-1",
            date = "2026-09-23",
            status = AttendanceStatus.PRESENT
        )

        assertEquals(AttendanceStatus.PRESENT, record.status)
    }
}
