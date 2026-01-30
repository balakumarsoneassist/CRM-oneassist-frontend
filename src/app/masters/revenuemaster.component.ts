import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
    selector: 'app-revenuemaster',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './revenuemaster.component.html',
    styleUrls: ['./revenuemaster.component.css']
})
export class RevenuemasterComponent implements OnInit {

    isAssignModalOpen = false;
    isRevenueModalOpen = false;
    isViewMode = false;
    employees: any[] = [];
    filteredEmployees: any[] = [];
    selectedEmployee: any = null;
    savedProductPercentages: any[] = [];

    //product config
    productList = [
        { product: 'PL', selfPercent: 0, connectorPercent: 0, isModified: false },
        { product: 'BL', selfPercent: 0, connectorPercent: 0, isModified: false },
        { product: 'HL', selfPercent: 0, connectorPercent: 0, isModified: false },
        { product: 'LAP', selfPercent: 0, connectorPercent: 0, isModified: false }
    ];

    productConfig = [
        { product: 'PL', self: 0, connector: 0 },
        { product: 'BL', self: 0, connector: 0 },
        { product: 'HL', self: 0, connector: 0 },
        { product: 'LAP', self: 0, connector: 0 }
    ];
    savedTargets: any[] = [];
    revenueForm!: FormGroup;

    constructor(
        private fb: FormBuilder,
        private http: HttpClient,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.initForm();
        this.loadProductPercentages();
        this.loadSavedTargets();
    }

    initForm() {
        this.revenueForm = this.fb.group({
            rows: this.fb.array([])
        });
    }

    get rows(): FormArray {
        return this.revenueForm.get('rows') as FormArray;
    }

    createRow(data?: any): FormGroup {
        return this.fb.group({
            business: [data?.business || '', Validators.required],
            volume: [data?.volume || 0, Validators.required],
            sourcing: [data?.sourcing || '', Validators.required],
            payoutPercent: [data?.payoutPercent || 0],
            revenue: [data?.revenue || 0],
        });

    }

    addRow(data?: any) {
        this.rows.push(this.createRow(data));
    }

    deleteRevenueRow(index: number) {
        this.rows.removeAt(index);
    }

    onSelfChange(event: any, index: number) {
        const value = Number(event.target.value || 0);
        this.productList[index].selfPercent = value;
        this.productConfig[index].self = value;
        this.productList[index].isModified = true;
    }

    onConnectorChange(event: any, index: number) {
        const value = Number(event.target.value || 0);
        this.productList[index].connectorPercent = value;
        this.productConfig[index].connector = value;
        this.productList[index].isModified = true;
    }


    // calculation
    recalcRow(index: number) {
        const row = this.rows.at(index) as FormGroup;
        const { business, volume, sourcing } = row.value;

        const config = this.productConfig.find(p => p.product === business);

        if (!config || !sourcing) {
            row.patchValue({ payoutPercent: 0, revenue: 0 });
            return;
        }

        const payout =
            sourcing === 'SELF'
                ? config.self
                : (sourcing === 'CONNECTOR' || sourcing === 'QR')
                    ? config.connector
                    : 0;

        row.patchValue({
            payoutPercent: payout,
            revenue: (Number(volume) * payout) / 100
        });
    }

    get totalRevenue(): number {
        return this.rows.controls.reduce(
            (sum, r) => sum + Number(r.value.revenue || 0),
            0
        );
    }

    openAssignTargetModal() {
        this.loadActiveEmployees();
        this.isAssignModalOpen = true;
    }

    closeAssignModal() {
        this.isAssignModalOpen = false;
    }

    get hasChanges(): boolean {
        return this.productList.some(p => p.isModified);
    }
    saveProductPercentages() {
        const payload = this.productList
            .map(p => ({
                productName: p.product,
                selfPercent: p.selfPercent,
                connectorPercent: p.connectorPercent
            }));

        if (payload.length === 0) {
            alert('No changes to save');
            return;
        }

        this.http.post(
            `${environment.apiUrl}/updateProductRevenue`,
            payload
        ).subscribe({
            next: () => {
                alert('Saved successfully');
                this.productList.forEach(p => p.isModified = false);
                this.cdr.detectChanges();
            },
            error: () => alert('Save failed')
        });
    }

    loadProductPercentages() {
        this.http
            .get<any[]>(`${environment.apiUrl}/getProductRevenue`)
            .subscribe({
                next: (data) => {
                    if (data && data.length > 0) {
                        this.savedProductPercentages = data;
                        this.cdr.detectChanges();
                        this.mapSavedValuesToProductList();
                        console.log(this.savedProductPercentages);
                    }
                },
                error: (err) => console.error(err)
            });
    }

    mapSavedValuesToProductList() {
        this.productList.forEach(item => {
            const saved = this.savedProductPercentages.find(
                s => s.product.toLowerCase() === item.product.toLowerCase()
            );

            if (saved) {
                const self = Number(saved.selfPercent);
                const connector = Number(saved.connectorPercent);

                // ✅ Update first table
                item.selfPercent = self;
                item.connectorPercent = connector;
                item.isModified = false;

                // ✅ IMPORTANT: sync second-table config
                const cfg = this.productConfig.find(p => p.product === item.product);
                if (cfg) {
                    cfg.self = self;
                    cfg.connector = connector;
                }
            }
        });

        this.cdr.detectChanges();
    }





    loadActiveEmployees() {
        this.http.get<any[]>(`${environment.apiUrl}/employees?isactive=true`)
            .subscribe({
                next: (res) => {
                    // Add disabled flag if employee already has a target
                    this.employees = res.map(emp => ({
                        ...emp,
                        disabled: this.savedTargets.some(t => t.employee_id === emp.id)
                    }));

                    // Initially, filtered list = all employees
                    this.filteredEmployees = [...this.employees];
                    this.cdr.detectChanges();
                },
                error: (err) => console.error('Failed to load employees', err)
            });
    }


    onEmployeeSearch(event: any) {
        const value = event.target.value.toLowerCase();

        this.filteredEmployees = this.employees
            .filter(emp => emp.name.toLowerCase().includes(value))
            .map(emp => ({
                ...emp // keep all properties including disabled
            }));
    }


    selectEmployee(emp: any) {
        this.selectedEmployee = emp;
        this.isViewMode = false;
        this.revenueForm.enable();
        this.isAssignModalOpen = false;
        this.isRevenueModalOpen = true;
        this.rows.clear();
        this.addRow();
        this.cdr.detectChanges();
    }

    //view saved target
    editTarget(target: any) {

        console.log('Edit clicked row:', target);
        this.isViewMode = true;
        this.selectedEmployee = {
            id: target.employee_id,
            name: target.employee_name
        };
        this.isRevenueModalOpen = true;
        this.rows.clear();

        this.http
            .get<any[]>(`${environment.apiUrl}/gettargetsbyemployee/${target.employee_id}`)
            .subscribe({
                next: (res) => {
                    if (!res || res.length === 0) {
                        this.addRow();
                        return;
                    }

                    res.forEach(r => {
                        this.rows.push(
                            this.fb.group({
                                business: [r.business],
                                volume: [Number(r.volume)],
                                sourcing: [r.sourcing],
                                payoutPercent: [Number(r.payoutPercent)],
                                revenue: [Number(r.revenue)]
                            })
                        );
                    });

                    this.totalRevenue;
                    this.revenueForm.disable();
                    this.cdr.detectChanges();
                },
                error: err => console.error(err)
            });
    }



    closeRevenueModal() {
        this.isRevenueModalOpen = false;
        this.rows.clear();
    }

    // save employee target
    saveEmployeeTarget() {
        if (!this.selectedEmployee) return;

        const payload = {
            employeeId: this.selectedEmployee.id,
            targets: this.rows.value,
            totalRevenue: this.totalRevenue
        };

        this.http.post(`${environment.apiUrl}/savetargets`, payload)
            .subscribe({
                next: () => {
                    alert('Revenue targets saved successfully!');
                    this.closeRevenueModal();
                    this.loadSavedTargets();
                    this.cdr.detectChanges();
                },
                error: err => console.error(err)
            });
    }

    // getting all targets
    loadSavedTargets() {
        this.http.get<any[]>(`${environment.apiUrl}/getalltargets`)
            .subscribe(res => {
                this.savedTargets = res;
                this.cdr.detectChanges();
            });
    }

    deleteEmployeeTarget(target: any) {
        if (!target || !target.employee_id) return;

        if (!confirm(`Are you sure you want to delete all targets for ${target.employee_name}?`)) {
            return;
        }

        this.http.delete(`${environment.apiUrl}/deletetarget/${target.employee_id}`)
            .subscribe({
                next: () => {
                    console.log(`Deleted targets for ${target.employee_name}`);


                    // Remove from savedTargets in UI
                    this.savedTargets = this.savedTargets.filter(t => t.employee_id !== target.employee_id);
                    this.loadSavedTargets();
                    alert(`Revenue targets for ${target.employee_name} deleted successfully!`);
                    this.cdr.detectChanges();
                },
                error: err => {
                    console.error('Failed to delete targets', err);
                    alert('Failed to delete employee targets');
                }
            });
    }


}
