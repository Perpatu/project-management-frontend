import {Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {SharedService} from '@core/service/shared.service';
import {AuthService} from '@core';
import {ActivatedRoute, Router} from '@angular/router';
import {MatTableDataSource} from '@angular/material/table';
import {MatSort} from '@angular/material/sort';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {MatPaginator, PageEvent} from "@angular/material/paginator";
import {UntypedFormBuilder, UntypedFormGroup, Validators} from "@angular/forms";
import {WebSocketService} from "@core/service/web-socket.service";

@Component({
  selector: 'app-department-detail',
  templateUrl: './department-detail.component.html',
  styleUrls: ['./department-detail.component.sass']
})
export class DepartmentDetailComponent implements OnInit {

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('paginator') paginator: MatPaginator;

  commentForm: UntypedFormGroup;
  columns: string[] = ["view", "name", "prev_task", "task", "next_task", "manager", "project", "comments"];
  depId: any;
  depName: string;
  status: string;
  tasks: any = [];
  dataSource: any = [];
  pathFile: string;
  pageNumber = 1;
  totalItems: number;
  pageSize = 20;
  pageSizeOptions: number[] = [20, 30, 50, 100];
  isWideScreen: boolean = window.innerWidth >= 960;

  constructor(
    private service: SharedService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private auth: AuthService,
    private fb: UntypedFormBuilder,
    private websocketService: WebSocketService,
  ) {
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.isWideScreen = window.innerWidth >= 960;
  }

  ngOnInit(): void {
    this.wsConnections();
    this.route.queryParams.subscribe((params: any) => {
      this.depId = params.dep_id;
      this.depName = params.dep_name;
      this.status = params.status;
      this.pageSize = params.page_size;
      this.pageNumber = params.page_number;
      this.loadsForms();
      this.loadDepartmentData(this.depId);
    });
  }

  wsConnections(): void {
    /*this.websocketService.connectFileDepartment().subscribe(
      message => {
        const messageObject = JSON.parse(message);
        if (messageObject.message.type === 'task') {
          //const file = messageObject.message.file;
          //this.loadDepartmentData(this.depId)
        } else if (messageObject.message.type === 'comment_add') {
          const commentFile = messageObject.message.comment;
          this.refreshFileComments(commentFile);
        } else if (messageObject.message.type === 'comment_delete') {
          const commentFile = messageObject.message.comment;
          this.deleteFileComments(commentFile);
        } else if (messageObject.message.type === 'file_delete') {
          const file = messageObject.message.file;
          this.refreshFiles(file);
        }
      },
      error => console.error('WebSocket error:', error)
    );*/
  }


  refreshFileComments(comment: any) {
    const fileIndex = this.tasks.findIndex((obj: any) => obj.id === comment.file.id);
    this.tasks[fileIndex].comments.push(comment);
  }

  deleteFileComments(comment: any) {
    const fileIndex = this.tasks.findIndex((obj: any) => obj.id === comment.file.id);
    const filteredComments = this.tasks[fileIndex].comments.filter((com: any) => com.id !== comment.id);
    this.tasks[fileIndex].comments = filteredComments;
  }

  refreshFiles(file: any) {
    const fileIndex = this.tasks.findIndex((obj: any) => obj.id === file.id);
    this.tasks.splice(fileIndex, 1);
    this.dataSource = new MatTableDataSource(this.tasks);
    this.dataSource.sort = this.sort;
  }

  loadsForms() {
    this.commentForm = this.fb.group({
      user: ['', Validators.required],
      file: ['', Validators.required],
      text: ['', Validators.required]
    });
  }


  paramsStatus() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        dep_id: this.depId,
        dep_name: this.depName,
        status: this.status,
        page_size: this.pageSize,
        page_number: this.pageNumber
      },
      queryParamsHandling: 'merge'
    });
  }

  loadDepartmentData(depId: any) {
    this.service.getTaskDepartmentAdmin(depId, this.status, this.pageSize, this.pageNumber).subscribe((data: any) => {
      this.tasks = data.tasks.data;
      this.dataSource = new MatTableDataSource(this.tasks);
      this.totalItems = data.tasks.totalItems;
      if(this.totalItems > 0){
        this.dataSource.sort = this.sort;
      }
    })
  }

  onPageChange(event: PageEvent) {
    const pageSize = event.pageSize;
    const pageNumber = event.pageIndex + 1;
    this.service.getTaskDepartmentAdmin(this.depId, this.status, pageSize, pageNumber).subscribe((data: any) => {
      this.tasks = data.data;
      this.dataSource = new MatTableDataSource(this.tasks);
      this.dataSource.sort = this.sort;
      this.totalItems = data.totalItems;
    })
  }

  openPdfFile(content: any, path: any) {
    this.pathFile = 'http://localhost:8000' + path;
    this.modalService.open(content, {centered: true, size: 'xl'});
  }

  expandCommentForm(element: any) {
    element.expand = !element.expand;
  }

  addComment(fileId: any) {
    this.commentForm.value.user = this.auth.currentUserValue.id;
    this.commentForm.value.file = fileId;
    this.service.addProductionFileComment(this.commentForm.value).subscribe();
  }

  deleteComment(commentId: any) {
    this.service.deleteProductionFileComment(commentId).subscribe();
  }

  searchFileDep(searchValue: string) {
    this.service.searchProductionFiles(this.depId, this.status, searchValue).subscribe((data: any) => {
      this.tasks = data.tasks.map((file: any) => ({
        ...file,
        expand: false
      }));
      this.dataSource = new MatTableDataSource(this.tasks);
      this.dataSource.sort = this.sort;
    });
  }

  changeStatus() {
    this.status = this.status === 'Active' ? 'Completed' : 'Active';
    this.paramsStatus();
    this.loadDepartmentData(this.depId);
  }

  updateTask(queue: any, field: any, status: any) {
    let currentDate: Date = new Date();
    const update = {
      'project': queue.project
    }
    if (field === 'start' && status) {
      update['real_start_date'] = currentDate;
    } else if (field === 'paused' && status) {
      update['paused_date'] = currentDate;
    } else if (field === 'end' && status) {
      update['real_end_date'] = currentDate;
    }
    update[field] = status;
    this.service.updateTask(queue.id, update).subscribe();
  }
}

