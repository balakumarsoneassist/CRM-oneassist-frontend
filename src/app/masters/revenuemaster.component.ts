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
    }

    initForm() {
        this.revenueForm = this.fb.group({
            rows: this.fb.array([])
        });
    }

    get rows(): FormArray {
        return this.revenueForm.get('rows') as FormArray;
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
                        this.mapSavedValuesToProductList();
                        this.cdr.detectChanges();
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






}
